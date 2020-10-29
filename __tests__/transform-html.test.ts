/* eslint-disable no-magic-numbers */
import {resolve} from 'path';
import {readFileSync} from 'fs';
import {transform} from '../src';

describe('transform', () => {
  it('given a file that includes html with header tags and maxHeaderLevel 8', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-html.md'), 'utf8');
    const headers = transform(content, {mode: 'github.com', maxHeaderLevel: 8});

    expect(headers.toc.split('\n')).toEqual(
      ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [Installation](#installation)',
        '- [API](#api)',
        '    - [dockops::Containers(docker) → {Object}](#dockopscontainersdocker-%E2%86%92-object)',
        '      - [Parameters:](#parameters)',
        '      - [Returns:](#returns)',
        '    - [dockops::Containers::activePorts(cb)](#dockopscontainersactiveportscb)',
        '      - [Parameters:](#parameters-1)',
        '    - [dockops::Containers::clean(id, cb)](#dockopscontainerscleanid-cb)',
        '      - [Parameters:](#parameters-2)',
        '- [^License](#license)',
        ''],
    );
  });

  it('given a file that includes html with header tags using default maxHeaderLevel', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-html.md'), 'utf8');
    const headers = transform(content);

    expect(headers.toc.split('\n')).toEqual(
      ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [Installation](#installation)',
        '- [API](#api)',
        '    - [dockops::Containers(docker) → {Object}](#dockopscontainersdocker-%E2%86%92-object)',
        '    - [dockops::Containers::activePorts(cb)](#dockopscontainersactiveportscb)',
        '    - [dockops::Containers::clean(id, cb)](#dockopscontainerscleanid-cb)',
        '- [^License](#license)',
        ''],
    );
  });

  it('given a file with headers embedded in code', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-code.md'), 'utf8');
    const headers = transform(content);

    expect(headers.toc.split('\n')).toEqual(
      ['## Table of Contents',
        '',
        '- [Single Backticks](#single-backticks)',
        '- [Multiple Backticks](#multiple-backticks)',
        '- [code tag](#code-tag)',
        '- [pre tag](#pre-tag)',
        '- [C](#c)',
        '- [C++](#c-1)',
        '- [C&#035;](#c-2)',
        '- [C&#035;](#c-3)',
        '- [C](#c-4)',
        ''],
    );
  });

  it('\ngiven a file with benign backticks', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-benign-backticks.md'), 'utf8');
    const headers = transform(content);

    expect(headers.toc.split('\n')).toEqual(
      ['**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
        '',
        '- [Hello, world!](#hello-world)',
        '- [Add this header](#add-this-header)',
        '- [And also this one](#and-also-this-one)',
        ''],
    );
  });
});
