const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment process...\n');

try {
  // Step 1: Build the project
  console.log('📦 Building the project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed!\n');

  // Step 2: Check if gh-pages branch exists
  console.log('🔍 Checking gh-pages branch...');
  try {
    execSync('git show-ref --verify refs/heads/gh-pages', { stdio: 'pipe' });
    console.log('✅ gh-pages branch exists\n');
  } catch {
    console.log('📝 Creating gh-pages branch...');
    execSync('git checkout --orphan gh-pages', { stdio: 'inherit' });
    execSync('git rm -rf .', { stdio: 'inherit' });
    execSync('git checkout main', { stdio: 'inherit' });
    console.log('✅ gh-pages branch created\n');
  }

  // Step 3: Navigate to out directory
  const outDir = path.join(__dirname, 'out');
  if (!fs.existsSync(outDir)) {
    throw new Error('Build output directory "out" not found!');
  }

  // Step 4: Save current branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`💾 Current branch: ${currentBranch}\n`);

  // Step 5: Switch to gh-pages branch
  console.log('🔄 Switching to gh-pages branch...');
  execSync('git checkout gh-pages', { stdio: 'inherit' });

  // Step 6: Remove old files (keep .git)
  console.log('🧹 Cleaning old files...');
  const files = fs.readdirSync('.');
  files.forEach(file => {
    if (file !== '.git' && file !== 'out' && file !== 'node_modules') {
      try {
        fs.rmSync(file, { recursive: true, force: true });
      } catch (err) {
        console.warn(`⚠️  Could not remove ${file}`);
      }
    }
  });

  // Step 7: Copy build files
  console.log('📋 Copying build files...');
  const outFiles = fs.readdirSync(outDir);
  outFiles.forEach(file => {
    const src = path.join(outDir, file);
    const dest = path.join('.', file);
    fs.cpSync(src, dest, { recursive: true });
  });
  console.log('✅ Files copied!\n');

  // Step 8: Create .nojekyll if not exists
  if (!fs.existsSync('.nojekyll')) {
    fs.writeFileSync('.nojekyll', '');
  }

  // Step 9: Commit and push
  console.log('💾 Committing changes...');
  execSync('git add .', { stdio: 'inherit' });
  
  try {
    execSync(`git commit -m "Deploy: ${new Date().toISOString()}"`, { stdio: 'inherit' });
    console.log('✅ Changes committed!\n');
    
    console.log('🚀 Pushing to remote gh-pages...');
    execSync('git push origin gh-pages --force', { stdio: 'inherit' });
    console.log('✅ Deployed successfully!\n');
  } catch (err) {
    if (err.message.includes('nothing to commit')) {
      console.log('ℹ️  No changes to deploy\n');
    } else {
      throw err;
    }
  }

  // Step 10: Switch back to original branch
  console.log(`🔄 Switching back to ${currentBranch}...`);
  execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });

  console.log('\n✨ Deployment completed successfully!');
  console.log('🌐 Your site will be available at: https://gdgscriet.github.io\n');

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  
  // Try to switch back to original branch
  try {
    execSync('git checkout main', { stdio: 'ignore' });
  } catch {}
  
  process.exit(1);
}
