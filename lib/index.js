#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = __importDefault(require("process"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const execa_1 = __importDefault(require("execa"));
const archiver_1 = __importDefault(require("archiver"));
const crypto_random_string_1 = __importDefault(require("crypto-random-string"));
const commander_1 = __importDefault(require("commander"));
async function caxa({ directory, command, output, filter, }) {
    var _a;
    if (!(await fs_extra_1.default.pathExists(directory)) ||
        !(await fs_extra_1.default.lstat(directory)).isDirectory())
        throw new Error(`The path to package isn’t a directory: ‘${directory}’.`);
    const identifier = path_1.default.join(path_1.default.basename(path_1.default.basename(output, ".app"), ".exe"), crypto_random_string_1.default({ length: 10, type: "alphanumeric" }).toLowerCase());
    const appDirectory = path_1.default.join(os_1.default.tmpdir(), "caxa", identifier);
    await fs_extra_1.default.copy(directory, appDirectory, { filter });
    // if we did not copy a node modules folder, but there is a package or package-lock file, run npm install
    if (!(await fs_extra_1.default.pathExists(path_1.default.join(appDirectory, "node_modules")))) {
        const packageLockPath = path_1.default.join(appDirectory, "package-lock.json");
        const packageJsonPath = path_1.default.join(appDirectory, "package.json");
        // prefer using package-lock, if available
        try {
            if (await fs_extra_1.default.pathExists(packageLockPath)) {
                await execa_1.default("npm", ["ci"], { cwd: appDirectory });
            }
            else if (await fs_extra_1.default.pathExists(packageJsonPath)) {
                throw null;
            }
        }
        catch (err) {
            try {
                await execa_1.default("npm", ["i"], { cwd: appDirectory });
            }
            catch (e) {
                // pass, nothing we can do here
                console.log(e);
            }
        }
    }
    await execa_1.default("npm", ["prune", "--production"], { cwd: appDirectory });
    await execa_1.default("npm", ["dedupe"], { cwd: appDirectory });
    await fs_extra_1.default.ensureDir(path_1.default.join(appDirectory, "node_modules/.bin"));
    await fs_extra_1.default.copyFile(process_1.default.execPath, path_1.default.join(appDirectory, "node_modules/.bin", path_1.default.basename(process_1.default.execPath)));
    await fs_extra_1.default.ensureDir(path_1.default.dirname(output));
    if (output.endsWith(".app")) {
        if (process_1.default.platform !== "darwin")
            throw new Error("macOS Application Bundles (.app) are supported in macOS only.");
        await fs_extra_1.default.remove(output);
        await fs_extra_1.default.ensureDir(path_1.default.join(output, "Contents/Resources"));
        await fs_extra_1.default.move(appDirectory, path_1.default.join(output, "Contents/Resources/app"));
        await fs_extra_1.default.ensureDir(path_1.default.join(output, "Contents/MacOS"));
        const name = path_1.default.basename(output, ".app");
        await fs_extra_1.default.writeFile(path_1.default.join(output, "Contents/MacOS", name), `#!/usr/bin/env sh\nopen "$(dirname "$0")/../Resources/${name}"`, { mode: 0o755 });
        await fs_extra_1.default.writeFile(path_1.default.join(output, "Contents/Resources", name), `#!/usr/bin/env sh\n${command
            .map((part) => `"${part.replace(/\{\{\s*caxa\s*\}\}/g, `$(dirname "$0")/app`)}"`)
            .join(" ")}`, { mode: 0o755 });
    }
    else {
        if (process_1.default.platform === "win32" && !output.endsWith(".exe"))
            throw new Error("An Windows executable must end in ‘.exe’.");
        await fs_extra_1.default.copyFile(path_1.default.join(__dirname, "../stubs", (_a = {
            win32: "windows.exe",
            darwin: "macos",
            linux: "linux",
        }[process_1.default.platform]) !== null && _a !== void 0 ? _a : (() => {
            throw new Error("caxa isn’t supported on this operating system.");
        })()), output);
        const archive = archiver_1.default("tar", { gzip: true });
        const archiveStream = fs_extra_1.default.createWriteStream(output, { flags: "a" });
        archive.pipe(archiveStream);
        archive.directory(appDirectory, false);
        await archive.finalize();
        // FIXME: Use ‘stream/promises’ when Node.js 16 lands, because then an LTS version will have the feature: await stream.finished(archiveStream);
        await new Promise((resolve, reject) => {
            archiveStream.on("finish", resolve);
            archiveStream.on("error", reject);
        });
        await fs_extra_1.default.appendFile(output, "\n" + JSON.stringify({ identifier, command }));
    }
}
exports.default = caxa;
if (require.main === module)
    (async () => {
        await commander_1.default.program
            .requiredOption("-d, --directory <directory>", "The directory to package.")
            .requiredOption("-c, --command <command-and-arguments...>", "The command to run and optional arguments to pass to the command every time the executable is called. Paths must be absolute. The ‘{{caxa}}’ placeholder is substituted for the folder from which the package runs. The ‘node’ executable is available at ‘{{caxa}}/node_modules/.bin/node’. Use double quotes to delimit the command and each argument.")
            .requiredOption("-o, --output <output>", "The path at which to produce the executable. Overwrites existing files/folders. On Windows must end in ‘.exe’. On macOS may end in ‘.app’ to generate a macOS Application Bundle.")
            .version(require("../package.json").version)
            .addHelpText("after", `
Examples:

  Windows:
  > caxa --directory "examples/echo-command-line-parameters" --command "{{caxa}}/node_modules/.bin/node" "{{caxa}}/index.js" "some" "embedded arguments" --output "echo-command-line-parameters.exe"

  macOS/Linux:
  $ caxa --directory "examples/echo-command-line-parameters" --command "{{caxa}}/node_modules/.bin/node" "{{caxa}}/index.js" "some" "embedded arguments" --output "echo-command-line-parameters"

  macOS (Application Bundle):
  $ caxa --directory "examples/echo-command-line-parameters" --command "{{caxa}}/node_modules/.bin/node" "{{caxa}}/index.js" "some" "embedded arguments" --output "Echo Command Line Parameters.app"
`)
            .action(async ({ directory, command, output, }) => {
            try {
                await caxa({ directory, command, output });
            }
            catch (error) {
                console.error(error.message);
                process_1.default.exit(1);
            }
        })
            .parseAsync();
    })();
//# sourceMappingURL=index.js.map