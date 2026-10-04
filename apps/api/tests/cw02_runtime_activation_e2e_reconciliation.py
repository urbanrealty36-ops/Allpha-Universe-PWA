"""CW-02 runtime activation and end-to-end reconciliation harness.

This is a non-destructive evidence harness for the existing Allpha runtime.
It never creates mock data and never creates an Agent unless ALLPHA_AGENT_ID
points to a real owner-owned Agent.

Required:
  ALLPHA_API_URL=https://<running-api>
  ALLPHA_ACCESS_TOKEN=<real Supabase authenticated access token>

Optional:
  ALLPHA_AGENT_ID=<real owned Agent UUID>
  ALLPHA_EXPECT_PERSISTED=true
"""
from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class Evidence:
    name: str
    passed: bool
    status: int | None
    detail: Any


def _json(response: httpx.Response) -> Any:
    if response.headers.get("content-type", "").startswith("application/json"):
        try:
            return response.json()
        except ValueError:
            return None
    return response.text[:500]


def _has_list_payload(value: Any, key: str = "data") -> bool:
    return isinstance(value, dict) and isinstance(value.get(key), list)


def main() -> int:
    base = os.getenv("ALLPHA_API_URL", "").rstrip("/")
    token = os.getenv("ALLPHA_ACCESS_TOKEN", "").strip()
    agent_id = os.getenv("ALLPHA_AGENT_ID", "").strip()
    require_runtime = os.getenv("ALLPHA_EXPECT_PERSISTED", "").lower() == "true"

    if not base or not token:
        print("BLOCKED: set ALLPHA_API_URL and ALLPHA_ACCESS_TOKEN.")
        return 2

    evidence: list[Evidence] = []

    with httpx.Client(base_url=base, timeout=30.0, follow_redirects=False) as client:
        # Public boundary.
        response = client.get("/health")
        health = _json(response)
        evidence.append(Evidence(
            "public_health",
            response.status_code == 200 and isinstance(health, dict) and health.get("service") == "allpha-api",
            response.status_code,
            health,
        ))

        # Canonical protected surfaces must reject unauthenticated access.
        protected_paths = [
            "/api/v1/runtime/activation",
            "/api/v1/themes/world-runtime/catalog",
            "/api/v1/discovery/home?surface=home&limit=12",
            "/api/v1/live/templates?source=platform&limit=12",
            "/api/v1/agents/me",
            "/api/v1/agent-runtime/commands?limit=20",
        ]
        for path in protected_paths:
            response = client.get(path)
            evidence.append(Evidence(
                f"unauthenticated_rejected:{path}",
                response.status_code == 401,
                response.status_code,
                _json(response),
            ))

        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

        # Product UX data contracts. Each endpoint is checked independently so
        # one domain failure cannot be mistaken for a complete product failure.
        product_endpoints = [
            (
                "authenticated_world_catalog",
                "/api/v1/themes/world-runtime/catalog",
                lambda value: _has_list_payload(value),
            ),
            (
                "authenticated_discovery_home",
                "/api/v1/discovery/home?surface=home&limit=12",
                lambda value: isinstance(value, dict)
                and isinstance(value.get("content"), (list, dict)),
            ),
            (
                "authenticated_live_templates",
                "/api/v1/live/templates?source=platform&limit=12",
                lambda value: _has_list_payload(value),
            ),
            (
                "authenticated_agent_list",
                "/api/v1/agents/me",
                lambda value: _has_list_payload(value),
            ),
        ]

        for name, path, validator in product_endpoints:
            response = client.get(path, headers=headers)
            value = _json(response)
            evidence.append(Evidence(
                name,
                response.status_code == 200 and validator(value),
                response.status_code,
                value,
            ))

        # Canonical runtime activation contract.
        response = client.get("/api/v1/runtime/activation", headers=headers)
        activation = _json(response)
        evidence.append(Evidence(
            "authenticated_activation",
            response.status_code == 200
            and isinstance(activation, dict)
            and isinstance(activation.get("data"), dict)
            and activation["data"].get("status") in {"ready", "blocked"},
            response.status_code,
            activation,
        ))

        # Canonical command read path.
        response = client.get("/api/v1/agent-runtime/commands?limit=20", headers=headers)
        commands = _json(response)
        evidence.append(Evidence(
            "authenticated_command_list",
            response.status_code == 200 and _has_list_payload(commands),
            response.status_code,
            commands,
        ))

        if agent_id:
            # This is intentionally a real-Agent path. No UUID is generated here.
            response = client.get(f"/api/v1/agents/{agent_id}", headers=headers)
            agent = _json(response)
            evidence.append(Evidence(
                "real_owned_agent_read",
                response.status_code == 200 and isinstance(agent, dict) and isinstance(agent.get("agent"), dict),
                response.status_code,
                agent,
            ))

            payload = {
                "agent_id": agent_id,
                "command": "CW-02 runtime evidence: return a concise acknowledgement.",
                "capabilities": ["ai.generate"],
                "idempotency_key": "cw02-runtime-evidence-harness-v2",
            }
            response = client.post("/api/v1/agent-runtime/commands", headers=headers, json=payload)
            created = _json(response)
            evidence.append(Evidence(
                "create_real_agent_command",
                response.status_code == 201 and isinstance(created, dict) and "data" in created,
                response.status_code,
                created,
            ))

            if response.status_code == 201 and isinstance(created, dict) and isinstance(created.get("data"), dict):
                command_id = created["data"].get("id") or created["data"].get("command_id")
                if command_id:
                    response = client.post(
                        f"/api/v1/agent-runtime/commands/{command_id}/plan",
                        headers=headers,
                    )
                    planned = _json(response)
                    evidence.append(Evidence(
                        "plan_real_agent_command",
                        response.status_code == 200 and isinstance(planned, dict) and "data" in planned,
                        response.status_code,
                        planned,
                    ))

                    response = client.post(
                        f"/api/v1/agent-runtime/commands/{command_id}/execute",
                        headers=headers,
                    )
                    executed = _json(response)
                    result_status = (
                        executed.get("data", {}).get("status")
                        if isinstance(executed, dict)
                        and isinstance(executed.get("data"), dict)
                        else None
                    )
                    evidence.append(Evidence(
                        "execute_real_agent_command",
                        response.status_code == 200
                        and result_status in {"completed", "waiting_approval", "running"},
                        response.status_code,
                        executed,
                    ))
        elif require_runtime:
            evidence.append(Evidence(
                "real_agent_runtime",
                False,
                None,
                "ALLPHA_AGENT_ID is required when ALLPHA_EXPECT_PERSISTED=true.",
            ))

    passed = sum(item.passed for item in evidence)
    total = len(evidence)
    result = {
        "harness": "CW-02-runtime-activation-e2e-reconciliation",
        "api": base,
        "evidence": [item.__dict__ for item in evidence],
        "summary": {
            "passed": passed,
            "total": total,
            "green": bool(evidence) and passed == total,
        },
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if evidence and passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
