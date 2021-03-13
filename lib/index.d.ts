#!/usr/bin/env node
export interface CaxaOptions {
    directory: string;
    command: string[];
    output: string;
    filter?: (src: string, dest: string) => boolean;
}
export default function caxa({ directory, command, output, filter, }: CaxaOptions): Promise<void>;
//# sourceMappingURL=index.d.ts.map