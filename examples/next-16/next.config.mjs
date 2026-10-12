/** @type {import("next").NextConfig} */
const nextConfig = {
  // Next.js would take the repository (whose lockfile is above this example's) as the root, and Turbopack could then resolve
  // modules from the repository's node_modules. With this folder as the root, the build uses only this example's install.
  turbopack: { root: import.meta.dirname },
}

export default nextConfig
