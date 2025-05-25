#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const child_process_1 = require("child_process");
const util_1 = require("util");
const zod_1 = require("zod");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const server = new mcp_js_1.McpServer({
    name: "AI Guards",
    version: "0.0.2"
});
server.resource("plan", new mcp_js_1.ResourceTemplate("plan://{message}", { list: undefined }), async (uri, { message }) => ({
    contents: [{
            uri: uri.href,
            text: `Resource plan: ${message}`
        }]
}));
server.tool("plan", { message: zod_1.z.string() }, async ({ message }) => {
    try {
        console.log(`Generating plan for message: ${message}`);
        const { stdout, stderr } = await execAsync(`npx ai-guards plan`);
        if (stderr) {
            return {
                content: [{ type: "text", text: `Error: ${stderr}` }]
            };
        }
        return {
            content: [{ type: "text", text: stdout }]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `Error executing command: ${errorMessage}` }]
        };
    }
});
server.prompt("plan-feature", { message: zod_1.z.string() }, ({ message }) => ({
    messages: [{
            role: "user",
            content: {
                type: "text",
                text: `Please generate a feature development plan for the following message: ${message}`
            }
        }]
}));
const transport = new stdio_js_1.StdioServerTransport();
(async () => {
    await server.connect(transport);
})().catch(error => {
    console.error("Failed to connect:", error);
    process.exit(1);
});
//# sourceMappingURL=server.mjs.map