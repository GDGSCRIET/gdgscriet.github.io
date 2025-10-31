const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const BUILD_DIR = 'out';
const DEPLOY_BRANCH = 'gh-pages';
// ---------------------

console.log('🚀 Starting deployment process...\n');

try {
  // Step 1: Build the project
  console.log('📦 Building the project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`✅ Build completed! Output is in '/${BUILD_DIR}'.\n`);

  // Step 2: Add a .nojekyll file to the build directory
  // This tells GitHub Pages to not run the files through Jekyll.
  console.log(`📝 Adding .nojekyll to '/${BUILD_DIR}'...`);
  fs.writeFileSync(path.join(__dirname, BUILD_DIR, '.nojekyll'), '');
  console.log('✅ .nojekyll file created.\n');

  // Step 3: Force-add the build directory to git.
  // We use -f (force) because the build directory is usually in .gitignore
  console.log(`git add ${BUILD_DIR} -f`);
  execSync(`git add ${BUILD_DIR} -f`, { stdio: 'inherit' });
  console.log('✅ Build directory added to staging.\n');

  // Step 4: Create a temporary commit with the build.
  // We use --allow-empty in case the build hasn't changed, but we still want to deploy.
  const commitMessage = `temp: Deploy build at ${new Date().toISOString()}`;
  console.log('💾 Creating temporary build commit...');
  execSync(`git commit -m "${commitMessage}" --allow-empty`, {
    stdio: 'inherit',
  });
  console.log('✅ Temporary commit created.\n');

  // Step 5: Push *only* the build directory to the 'gh-pages' branch.
  // This command is the magic:
  // 'git subtree push' - Pushes a subdirectory to a remote.
  // '--prefix out' - Specifies that only the 'out' folder's *contents* should be pushed.
  // 'origin gh-pages' - The destination remote and branch.
  console.log(`🚀 Pushing '/${BUILD_DIR}' contents to '${DEPLOY_BRANCH}' branch...`);
  execSync(`git subtree push --prefix ${BUILD_DIR} origin ${DEPLOY_BRANCH}`, {
    stdio: 'inherit',
  });
  console.log('✅ Deployed successfully to GitHub Pages!\n');

  // Step 6: Remove the temporary commit from the main branch.
  // This cleans up your local 'main' branch history,
  // so the build commit doesn't clutter it.
  console.log('🧹 Cleaning up temporary commit from local branch...');
  execSync('git reset HEAD~1', { stdio: 'inherit' });
  console.log('✅ Local branch history cleaned.\n');

  // Step 7: Get the remote URL to show the user
  try {
    const remoteUrl = execSync('git config --get remote.origin.url')
      .toString()
      .trim();
    // Regex to match https://github.com/user/repo.git or git@github.com:user/repo.git
    const urlMatch = remoteUrl.match(/github\.com[/:]([\w-]+\/[\w-]+\.git)/);
    if (urlMatch && urlMatch[1]) {
      const [user, repo] = urlMatch[1].replace('.git', '').split('/');
      console.log('-----------------------------------');
      console.log('✨ Deployment complete!');
      console.log(
        `🌐 Your site should be live at: https://${user}.github.io/${repo}\n`
      );
      console.log('-----------------------------------');
    } else {
      console.log('✨ Deployment complete! Check your GitHub Pages URL.\n');
    }
  } catch (err) {
    console.log('✨ Deployment complete! Check your GitHub Pages URL.\n');
  }
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);

  // Attempt to clean up the temporary commit in case of failure
  console.log('Attempting to roll back temporary commit...');
  try {
    execSync('git reset HEAD~1', { stdio: 'ignore' });
    console.log('Temporary commit rolled back.');
  } catch (cleanupError) {
    console.warn('Could not roll back temporary commit. You may need to run "git reset HEAD~1" manually.');
  }

  process.exit(1);
}
