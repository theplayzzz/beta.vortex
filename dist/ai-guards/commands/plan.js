"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const idGenerator_1 = require("../utils/idGenerator");
const gitUtils_1 = require("../utils/gitUtils");
function planCommand(program) {
    program
        .command('plan')
        .description('Generate a new AI plan template')
        .option('-t, --title <title>', 'Title for the plan')
        .option('-a, --author <author>', 'Author of the plan')
        .action(async (options) => {
        try {
            const aiGuardsDir = path.join(process.cwd(), '.ai-guards');
            const plansDir = path.join(aiGuardsDir, 'plans');
            // Ensure plans directory exists
            await fs.ensureDir(plansDir);
            // Use options or defaults
            const title = options.title || 'Your Plan Title';
            // Get author from options, or from git user, or use default
            let author = options.author;
            if (!author) {
                const gitUser = await (0, gitUtils_1.getGitUser)();
                author = gitUser.name || 'ai-guards';
            }
            // Generate plan ID and date
            const planId = (0, idGenerator_1.generatePlanId)();
            const createdAt = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            // Create plan template content
            const planContent = `---
id: ${planId}
title: ${title}
createdAt: ${createdAt}
author: ${author}
status: draft
---

## 🧩 Scope

Your project scope description here...

## ✅ Functional Requirements

- Requirement 1
- Requirement 2
- Requirement 3

## ⚙️ Non-Functional Requirements

- Performance: specify requirements
- Security: specify requirements 
- Scalability: specify requirements

## 📚 Guidelines & Packages

- Follow project guidelines: specify which ones
- Packages to use: list them here with license

## 🔐 Threat Model (Stub)

- Security threat 1
- Security threat 2

## 🔢 Execution Plan

1. First implementation step
2. Second implementation step
3. Third implementation step
`;
            // Save plan to file
            const planFilename = `${planId}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;
            const planFilePath = path.join(plansDir, planFilename);
            await fs.writeFile(planFilePath, planContent);
            console.log(chalk_1.default.green(`Plan template created successfully: ${planFilename}`));
            console.log(chalk_1.default.blue(`Plan ID: ${planId}`));
            console.log(chalk_1.default.blue(`Saved to: ${planFilePath}`));
            console.log(chalk_1.default.yellow(`Edit the file to fill in your plan details`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error generating plan template:'), error);
            process.exit(1);
        }
    });
}
exports.default = planCommand;
//# sourceMappingURL=plan.js.map