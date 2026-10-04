"""CW-02 authenticated runtime evidence harness.

Runs against the existing Allpha FastAPI runtime. It does not create agents,
content, schema, RPCs, or mock data.

Required:
  ALLPHA_API_URL=https://<running-api>
  ALLPHA_ACCESS_TOKEN=<real Supabase authenticated access token>

Optional:
  ALLPHA_AGENT_ID=<real owned Agent UUID>
  ALLPHA_EXPECT_PERSISTED=true   # require runtime command creation/execution
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
        # 1. Public health proves the target is the existing FastAPI service.
        r = client.get("/health")
        evidence.append(Evidence(
            "public_health",
            r.status_code == 200 and r.json().get("service") == "allpha-api",
            r.status_code,
            r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text[:500],
        ))

        # 2. Negative auth proves the runtime boundary rejects unauthenticated access.
        r = client.get("/api/v1/runtime/activation")
        evidence.append(Evidence(
            "unauthenticated_rejected",
            r.status_code == 401,
            r.status_code,
            r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text[:500],
        ))

        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

        # 3. Authenticated identity reaches the canonical activation endpoint.
        r = client.get("/api/v1/runtime/activation", headers=headers)
        activation = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        evidence.append(Evidence(
            "authenticated_activation",
            r.status_code == 200 and "data" in activation,
            r.status_code,
            activation,
        ))

        # 4. Authenticated command listing proves the API can read the canonical runtime.
        r = client.get("/api/v1/agent-runtime/commands?limit=20", headers=headers)
        commands = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        evidence.append(Evidence(
            "authenticated_command_list",
            r.status_code == 200 and "data" in commands,
            r.status_code,
            commands,
        ))

        if agent_id:
            # 5. Optional real-Agent path. The harness never invents an Agent UUID.
            payload = {
                "agent_id": agent_id,
                "command": "CW-02 runtime evidence: return a concise acknowledgement.",
                "capabilities": ["ai.generate"],
                "idempotency_key": "cw02-runtime-evidence-harness-v1",
            }
            r = client.post("/api/v1/agent-runtime/commands", headers=headers, json=payload)
            created = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
            evidence.append(Evidence(
                "create_real_agent_command",
                r.status_code == 201 and "data" in created,
                r.status_code,
                created,
            ))

            if r.status_code == 201 and isinstance(created.get("data"), dict):
                command_id = created["data"].get("id") or created["data"].get("command_id")
                if command_id:
                    r = client.post(f"/api/v1/agent-runtime/commands/{command_id}/plan", headers=headers)
                    planned = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
                    evidence.append(Evidence(
                        "plan_real_agent_command",
                        r.status_code == 200 and "data" in planned,
                        r.status_code,
                        planned,
                    ))

                    r = client.post(f"/api/v1/agent-runtime/commands/{command_id}/execute", headers=headers)
                    executed = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
                    # Waiting for approval is an authenticated runtime result, not a failure.
                    result_status = ((executed.get("data") or {}).get("status"))
                    evidence.append(Evidence(
                        "execute_real_agent_command",
                        r.status_code == 200 and result_status in {"completed", "waiting_approval", "running"},
                        r.status_code,
                        executed,
                    ))
        elif require_runtime:
            evidence.append(Evidence(
                "real_agent_runtime",
                False,
                None,
                "ALLPHA_AGENT_ID is required when ALLPHA_EXPECT_PERSISTED=true.",
            ))

    print(json.dumps({
        "harness": "CW-02-authenticated-runtime-evidence",
        "api": base,
        "evidence": [e.__dict__ for e in evidence],
        "summary": {
            "passed": sum(e.passed for e in evidence),
            "total": len(evidence),
            "green": bool(evidence) and all(e.passed for e in evidence),
        },
    }, indent=2, ensure_ascii=False))

    return 0 if evidence and all(e.passed for e in evidence) else 1


if __name__ == "__main__":
    sys.exit(main())
