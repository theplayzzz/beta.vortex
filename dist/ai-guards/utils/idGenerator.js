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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlanId = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const glob = __importStar(require("glob"));
/**
 * Generates a unique plan ID in the format "plan-XXX"
 * where XXX is a three-digit number (e.g., plan-001)
 * Ensures the ID doesn't clash with existing plans
 */
function generatePlanId() {
    // Find existing plan IDs
    const plansDir = path.join(process.cwd(), '.ai-guards', 'plans');
    // Create plans directory if it doesn't exist
    if (!fs.existsSync(plansDir)) {
        fs.mkdirSync(plansDir, { recursive: true });
        return 'plan-001'; // First plan
    }
    try {
        // Get existing plan files
        const planFiles = glob.sync('*.md', { cwd: plansDir });
        // Extract existing IDs
        const existingIds = new Set();
        planFiles.forEach(file => {
            const match = file.match(/plan-(\d{3})/);
            if (match && match[1]) {
                existingIds.add(parseInt(match[1], 10));
            }
        });
        // Find the next available ID
        let nextId = 1;
        while (existingIds.has(nextId) && nextId <= 999) {
            nextId++;
        }
        // Ensure we haven't exceeded the limit
        if (nextId > 999) {
            throw new Error('Maximum number of plans (999) reached. Archive some plans.');
        }
        // Format the ID with leading zeros
        const paddedId = nextId.toString().padStart(3, '0');
        return `plan-${paddedId}`;
    }
    catch (error) {
        console.error('Error generating plan ID:', error);
        // Fallback to random ID if there's an error
        const randomNum = Math.floor(Math.random() * 999) + 1;
        const paddedNum = randomNum.toString().padStart(3, '0');
        return `plan-${paddedNum}`;
    }
}
exports.generatePlanId = generatePlanId;
//# sourceMappingURL=idGenerator.js.map