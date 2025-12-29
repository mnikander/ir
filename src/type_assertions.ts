// Copyright (c) 2025 Marco Nikander

import { Value } from './instructions.ts'

export function get_boolean(value: undefined | Value): boolean {
    if (value === undefined || typeof value.value !== 'boolean') {
        throw Error('expected value to contain a boolean');
    }
    else {
        return value.value;
    }
}

export function get_number(value: undefined | Value): number {
    if (value === undefined || typeof value.value !== 'number') {
        throw Error('expected value to contain a number');
    }
    else {
        return value.value;
    }
}

export function valid<T> (value: null | undefined | T): T {
    if (value === undefined) {
        throw Error('expected a defined value');
    }
    else if (value === null) {
        throw Error('expected a non-null value');
    }
    else {
        return value;
    }
}
