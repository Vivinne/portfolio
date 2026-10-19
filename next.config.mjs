/** Static site for GitHub Pages at https://vivinne.github.io/portfolio/ */
const nextConfig = {
  output: 'export',            // `next build` writes plain files to out/
  basePath: '/portfolio',      // the repository name, i.e. the site's sub-path on github.io
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
