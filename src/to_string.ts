// Copyright (c) 2026 Marco Nikander

import { Arithmetic, Comparison, Get, Instruction, Label, Ownership, Phi, Program, Register } from "./instructions.ts";

export function to_string(program: Program): string {
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
                case 'Phi':       output += `${line[Get.Dest]}\t= ${line[Get.Tag].toLowerCase()} ${concat_phi_entries(line)} \n`; break;
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

function unary(line: Ownership): string {
    return `${line[Get.Dest]}\t= ${line[Get.Tag].toLowerCase()} ${line[Get.First]}\n`;
}

function binary(line: Arithmetic | Comparison): string {
    return `${line[Get.Dest]}\t= ${line[Get.Tag].toLowerCase()} ${line[Get.First]} ${line[Get.Second]}\n`;
}

export function concat_phi_entries(phi: Phi): string {
    let result: string = '';
    phi[Get.First].forEach((lr: [Label, Register]) => {
        result += lr[0];
        result += ' ';
        result += lr[1];
        result += ' ';
    });
    return result;
}
