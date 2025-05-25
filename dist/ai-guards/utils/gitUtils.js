"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitUser = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Get the current git user's name and email
 * @returns A promise that resolves to an object containing the user's name and email
 */
async function getGitUser() {
    try {
        // Get the user's name from git config
        const { stdout: nameStdout } = await execAsync('git config user.name');
        const name = nameStdout.trim();
        // Get the user's email from git config
        const { stdout: emailStdout } = await execAsync('git config user.email');
        const email = emailStdout.trim();
        return { name, email };
    }
    catch (error) {
        // Return empty strings if git commands fail
        console.warn('Failed to get git user information:', error);
        return { name: '', email: '' };
    }
}
exports.getGitUser = getGitUser;
//# sourceMappingURL=gitUtils.js.map