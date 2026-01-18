// Copyright (c) 2026 Marco Nikander

import { Binary, Instruction, Get, Unary } from "./instructions.ts";

export function to_string(program: readonly Instruction[]): string {
    let pc: number = 0;
    let output: string = "";

    try {
        while (pc < program.length) {
            const line: Instruction     = program[pc];
    
            switch (line[Get.Tag]) {
                case 'Const':     output += unary(line); break;
                case 'Copy':      output += unary(line); break;
                case 'Drop':      output += unary(line); break;
                case 'Move':      output += unary(line); break;
                case 'Ref':       output += unary(line); break;
                case 'Deref':     output += unary(line); break;
                case 'Add':       output += binary(line); break;
                case 'Subtract':  output += binary(line); break;
                case 'Multiply':  output += binary(line); break;
                case 'Divide':    output += binary(line); break;
                case 'Remainder': output += binary(line); break;
                case 'Equal':     output += binary(line); break;
                case 'Unequal':   output += binary(line); break;
                case 'Jump':      output += `${line[Get.Tag].toLowerCase()} ${line[Get.First]}\n`; break;
                case 'Branch':    output += `${line[Get.Tag].toLowerCase()} ${line[Get.First]} ${line[Get.Second]} ${line[Get.Third]} \n`; break;
                case 'Call':      output += `${line[Get.Tag].toLowerCase()} ${line[Get.First]} [${line[Get.Second]}]\n`; break;
                case 'Return':    output += `${line[Get.Tag].toLowerCase()} ${line[Get.First]}\n`; break;
                case 'Phi':       output += `${line[Get.Dest]}\t= ${line[Get.Tag].toLowerCase()} ${line[Get.First]} ${line[Get.Second]} ${line[Get.Third]} ${line[Get.Fourth]}\n`; break;
                case 'Exit':      output += `${line[Get.Tag].toLowerCase()} ${line[Get.First]}\n`; break;
                case 'Block':     output += `\n${line[Get.Tag].toLowerCase()} ${line[Get.First]}:\n`; break;
                case 'Function':  output += `\n${line[Get.Tag].toLowerCase()} ${line[Get.First]} [${line[Get.Second]}]:\n`; break;
                default:          throw Error(`unhandled instruction type '${(line as Instruction)[Get.Tag]}'`);
            }
            pc++;
        }
    }
    catch (error) {
        // catch and then re-throw all errors, with the line-number prepended, for easier debugging
        throw Error(`Line ${pc}: ` + (error as Error).message);
    }
    return output;
}

function unary(line: Unary): string {
    return `${line[Get.Dest]}\t= ${line[Get.Tag].toLowerCase()} ${line[Get.First]}\n`;
}

function binary(line: Binary): string {
    return `${line[Get.Dest]}\t= ${line[Get.Tag].toLowerCase()} ${line[Get.First]} ${line[Get.Second]}\n`;
}
