const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, 'projects');
const mainReadmeText = '\n\n---\n> **Note:** For a complete list of my projects, please visit the [Main Portfolio README](../../README.md).';

fs.readdirSync(projectsDir).forEach(dir => {
    const fullPath = path.join(projectsDir, dir);
    if (fs.statSync(fullPath).isDirectory()) {
        const readmePath = path.join(fullPath, 'README.md');
        let content = '';

        if (fs.existsSync(readmePath)) {
            content = fs.readFileSync(readmePath, 'utf8');
            if (!content.includes('[Main Portfolio README](../../README.md)') && !content.includes('[⬅️ Back to Main Portfolio](../../README.md)')) {
                content += mainReadmeText;
                fs.writeFileSync(readmePath, content);
                console.log("Updated " + dir + "/README.md");
            } else {
                console.log("Skipped " + dir + "/README.md (Already contains link)");
            }
        } else {
            content = "# " + dir + "\n\nA specialized sub-project in the Adish Yermal Portfolio.\n";
            content += mainReadmeText;
            fs.writeFileSync(readmePath, content);
            console.log("Created " + dir + "/README.md");
        }
    }
});
