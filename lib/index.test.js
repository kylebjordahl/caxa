"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const execa_1 = __importDefault(require("execa"));
const crypto_random_string_1 = __importDefault(require("crypto-random-string"));
globals_1.jest.setTimeout(300000);
const testsDirectory = path_1.default.join(os_1.default.tmpdir(), "caxa-tests", crypto_random_string_1.default({ length: 10, type: "alphanumeric" }).toLowerCase());
globals_1.beforeAll(async () => {
    await fs_extra_1.default.remove(path_1.default.join(os_1.default.tmpdir(), "caxa"));
    await fs_extra_1.default.remove(testsDirectory);
    await fs_extra_1.default.ensureDir(testsDirectory);
});
globals_1.test("echo-command-line-parameters", async () => {
    const output = path_1.default.join(testsDirectory, `echo-command-line-parameters${process.platform === "win32" ? ".exe" : ""}`);
    const appDirectory = path_1.default.join(os_1.default.tmpdir(), "caxa", "echo-command-line-parameters");
    await execa_1.default("ts-node", [
        "src/index.ts",
        "--directory",
        "examples/echo-command-line-parameters",
        "--command",
        "{{caxa}}/node_modules/.bin/node",
        "{{caxa}}/index.js",
        "some",
        "embedded arguments",
        "--output",
        output,
    ]);
    // Cached from build.
    globals_1.expect((await execa_1.default(output, ["and", "some arguments passed on the call"], {
        all: true,
    })).all).toMatchInlineSnapshot(`
    "[
      \\"some\\",
      \\"embedded arguments\\",
      \\"and\\",
      \\"some arguments passed on the call\\"
    ]"
  `);
    globals_1.expect(await fs_extra_1.default.pathExists(appDirectory)).toBe(true);
    await fs_extra_1.default.remove(appDirectory);
    globals_1.expect(await fs_extra_1.default.pathExists(appDirectory)).toBe(false);
    // Uncached.
    globals_1.expect((await execa_1.default(output, ["and", "some arguments passed on the call"], {
        all: true,
    })).all).toMatchInlineSnapshot(`
    "[
      \\"some\\",
      \\"embedded arguments\\",
      \\"and\\",
      \\"some arguments passed on the call\\"
    ]"
  `);
    // Cached from previous run.
    globals_1.expect((await execa_1.default(output, ["and", "some arguments passed on the call"], {
        all: true,
    })).all).toMatchInlineSnapshot(`
    "[
      \\"some\\",
      \\"embedded arguments\\",
      \\"and\\",
      \\"some arguments passed on the call\\"
    ]"
  `);
});
if (process.platform === "darwin")
    globals_1.test("Echo Command Line Parameters.app", async () => {
        const output = path_1.default.join(testsDirectory, "Echo Command Line Parameters.app");
        await execa_1.default("ts-node", [
            "src/index.ts",
            "--directory",
            "examples/echo-command-line-parameters",
            "--command",
            "{{caxa}}/node_modules/.bin/node",
            "{{caxa}}/index.js",
            "some",
            "embedded arguments",
            "--output",
            output,
        ]);
        console.log(`Test the macOS Application Bundle (.app) manually:\n$ open -a "${output}"`);
        globals_1.expect((await execa_1.default(path_1.default.join(output, "/Contents/Resources/Echo Command Line Parameters"), {
            all: true,
        })).all).toMatchInlineSnapshot(`
      "[
        \\"some\\",
        \\"embedded arguments\\"
      ]"
    `);
    });
globals_1.test("native-modules", async () => {
    const output = path_1.default.join(testsDirectory, `native-modules${process.platform === "win32" ? ".exe" : ""}`);
    const appDirectory = path_1.default.join(os_1.default.tmpdir(), "caxa", "native-modules");
    await execa_1.default("npm", ["install"], { cwd: "examples/native-modules" });
    await execa_1.default("ts-node", [
        "src/index.ts",
        "--directory",
        "examples/native-modules",
        "--command",
        "{{caxa}}/node_modules/.bin/node",
        "{{caxa}}/index.js",
        "--output",
        output,
    ]);
    // Cached from build.
    globals_1.expect((await execa_1.default(output, { all: true })).all).toMatchInlineSnapshot(`
    "@leafac/sqlite: {
      \\"example\\": \\"caxa native modules\\"
    }
    sharp: 48"
  `);
    globals_1.expect(await fs_extra_1.default.pathExists(appDirectory)).toBe(true);
    await fs_extra_1.default.remove(appDirectory);
    globals_1.expect(await fs_extra_1.default.pathExists(appDirectory)).toBe(false);
    // Uncached.
    globals_1.expect((await execa_1.default(output, { all: true })).all).toMatchInlineSnapshot(`
    "@leafac/sqlite: {
      \\"example\\": \\"caxa native modules\\"
    }
    sharp: 48"
  `);
    // Cached from previous run.
    globals_1.expect((await execa_1.default(output, { all: true })).all).toMatchInlineSnapshot(`
    "@leafac/sqlite: {
      \\"example\\": \\"caxa native modules\\"
    }
    sharp: 48"
  `);
});
globals_1.test("false", async () => {
    const output = path_1.default.join(testsDirectory, `false${process.platform === "win32" ? ".exe" : ""}`);
    const appDirectory = path_1.default.join(os_1.default.tmpdir(), "caxa", "false");
    await execa_1.default("ts-node", [
        "src/index.ts",
        "--directory",
        "examples/false",
        "--command",
        "{{caxa}}/node_modules/.bin/node",
        "{{caxa}}/index.js",
        "--output",
        output,
    ]);
    // Cached from build.
    await globals_1.expect(execa_1.default(output)).rejects.toThrowError("Command failed with exit code 1");
    globals_1.expect(await fs_extra_1.default.pathExists(appDirectory)).toBe(true);
    await fs_extra_1.default.remove(appDirectory);
    globals_1.expect(await fs_extra_1.default.pathExists(appDirectory)).toBe(false);
    // Uncached.
    await globals_1.expect(execa_1.default(output)).rejects.toThrowError("Command failed with exit code 1");
    // Cached from previous run.
    await globals_1.expect(execa_1.default(output)).rejects.toThrowError("Command failed with exit code 1");
});
//# sourceMappingURL=index.test.js.map