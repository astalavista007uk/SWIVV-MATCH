<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
## Deploy

The live site (https://swivvmatch.com) runs on the owner's VPS: `root@92.242.188.41`, app in `/opt/swivv`, systemd service `swivv`, Caddy reverse-proxying port 3000.

- Deploy with `bun run deploy` (`scripts/deploy-vps.ps1`: build with the server's `VITE_*` env, scp `.output`, swap, restart, health check).
- Vercel is NOT used: do not add Vercel config, headers (`x-vercel-*`) or analytics.
