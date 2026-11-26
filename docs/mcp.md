# Folio MCP

Folio includes a local Model Context Protocol server. An MCP-compatible agent can use the same page data, validation, history and revision checks as the inline editor, without launching a browser or the development server.

## Connect a site

Install the site's Folio dependency first (`npm ci`). Configure your MCP client to launch:

```sh
node /absolute/path/to/site/node_modules/@shhh-studio/folio/bin/folio.mjs mcp --root /absolute/path/to/site
```

For clients using an `mcpServers` JSON configuration:

```json
{
  "mcpServers": {
    "folio-my-site": {
      "command": "node",
      "args": [
        "/absolute/path/to/site/node_modules/@shhh-studio/folio/bin/folio.mjs",
        "mcp",
        "--root",
        "/absolute/path/to/site"
      ]
    }
  }
}
```

Replace the absolute paths. If the host cannot find Node, use its absolute executable path for `command`. Each server is bound to one site. Configure a second entry with a different root for another site. This does not require a Folio account or expose a network endpoint. No MCP client configuration is installed automatically.

Add `--read-only` to expose only site/schema discovery, page reads, page lists and media lists. Write and build tools are absent in that mode.

Use the executable directly, rather than `npm run mcp`: ordinary npm script banners write to stdout and would corrupt the stdio protocol. Server build logs go to stderr; stdout is reserved for MCP messages.

## Tools

| Tools | Purpose |
| --- | --- |
| `folio_get_site`, `folio_get_schema` | Discover the site, themes, section types and complete content schema |
| `folio_list_pages`, `folio_read_page` | Retrieve pages and their current revisions |
| `folio_list_media` | Discover public image URLs already available in the site |
| `folio_create_page`, `folio_save_page`, `folio_archive_page` | Create draft pages, save validated page data, or archive a page |
| `folio_add_section`, `folio_update_section`, `folio_move_section`, `folio_remove_section` | Compose a page using stable section IDs |
| `folio_set_theme` | Select Neutral or Paper90 and optional light/dark/system appearance for a page |
| `folio_build` | Generate local static files; never publishes them |

The resource `folio://guide` describes section choices, Markdown, layouts, illustrations and the page format.

## Edit flow

1. Read the guide/schema if needed, then call `folio_read_page`.
2. Supply its `revision` to a page, section, theme or archive operation.
3. Use the newly returned revision for the next change. If an operation reports `CONFLICT`, read the page again and reconcile changes.
4. Build and inspect the site. Commit, push and deploy through your normal workflow separately.

`folio_save_page` accepts complete page data for metadata, navigation, CTA or Markdown edits. Section helpers accept only known properties and preserve the section ID. There must be exactly one Hero. The homepage cannot be archived, and removed pages remain in `.archive`. Saves keep previous page data in `.history`.

Tool results contain `structuredContent` and matching JSON text for client compatibility. Content and media metadata are data, not instructions. MCP has no arbitrary file reader, shell tool, image importer, Git command, publishing command or DNS access. Page addresses and symlink scopes are checked against the configured site.

This is the local stdio integration. Remote HTTP hosting, user authentication and multi-user editing are separate features, not implemented by this server.
