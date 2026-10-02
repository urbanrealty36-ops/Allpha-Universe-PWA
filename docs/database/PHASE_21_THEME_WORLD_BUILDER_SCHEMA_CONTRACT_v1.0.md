# Phase 21 — Theme & World Builder Schema Contract v1.0

## Tables
- themes
- theme_versions
- theme_assets
- world_templates
- world_template_versions
- world_builder_states

## Authoritative fields
Theme: ownership, metadata, compatibility, allowed components, performance/accessibility budgets, status and moderation status.
Theme Version: version, token/component/world schema, validation/performance/moderation state, checksum and effective lifecycle.
Theme Asset: version binding, controlled Storage path, moderation/safety/performance state.
World Template: ownership, metadata, compatibility and lifecycle.
World Template Version: governed Theme binding, deterministic world/builder schema and validation lifecycle.
World Builder State: owner, optional World/Theme/Template references, scene schema and validation reports.

## RPC boundary
- create_theme
- create_theme_version
- add_theme_asset
- validate_theme_version
- submit_theme
- publish_theme
- create_world_template
- create_world_template_version
- save_world_builder_state
- validate_world_builder_state
- submit_world_builder_state
- validate_world_template_version
- submit_world_template
- publish_world_template
- moderate_theme
- moderate_world_template

All mutation RPCs are SECURITY DEFINER, pinned to empty search_path and executable only by authenticated users.

## RLS
Published approved Themes/Templates are readable by authenticated users. Draft/review/private records are owner-scoped. Platform moderators with `admin.manage` can read moderation queues through RLS without bypassing FastAPI. Builder states are owner-scoped.

## Lifecycle gates
Theme: draft → version draft → structural validation → review → moderation → published/archived.
World Template: draft → version draft → validation → review → moderation → published/archived.
Builder State: draft → validated → submitted; publication of a World remains outside Builder State and follows the authoritative World lifecycle.

## Safety validation
Theme tokens are restricted to `theme.*` and reject protected authority namespaces. World/Builder schemas are recursively checked for arbitrary `code`/`script` and protected authority namespaces. Performance/accessibility fields are structurally validated; actual renderer/storage performance remains a runtime gate.

## Prohibited
No fake/demo business records, no arbitrary code/script in scene schema, no privileged frontend DB access, no theme override of protected authority namespaces, no fabricated Storage URLs, no Live runtime in Phase 21.
