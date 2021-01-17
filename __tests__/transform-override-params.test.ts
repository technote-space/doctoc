/* eslint-disable no-magic-numbers */
import {resolve} from 'path';
import {readFileSync} from 'fs';
import {transform} from '../src';

describe('transform', () => {
  it('override params (empty toc)', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-params1.md'), 'utf8');
    const headers = transform(content, {isNotitle: true, isFolding: false, maxHeaderLevel: 1, entryPrefix: '*'});

    expect(headers.wrappedToc.split('\n')).toEqual(
      [
        '<!-- START doctoc generated TOC please keep comment here to allow auto update -->',
        '<!-- DON\'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->',
        '<!-- param::entryPrefix::-:: -->',
        '<!-- param::mode::github.com:: -->',
        '<!-- param::isNotitle::false:: -->',
        '<!-- param::maxHeaderLevel::8:: -->',
        '**Table of Contents**  *generated with [DocToc](https://github.com/technote-space/doctoc)*',
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
        '',
        '<!-- END doctoc generated TOC please keep comment here to allow auto update -->',
      ],
    );
  });

  it('override params (not empty toc)', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-params2.md'), 'utf8');
    const headers = transform(content, {isNotitle: true, isFolding: false, maxHeaderLevel: 1, entryPrefix: '*'});

    expect(headers.wrappedToc.split('\n')).toEqual(
      [
        '<!-- START doctoc generated TOC please keep comment here to allow auto update -->',
        '<!-- DON\'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->',
        '<!-- param::entryPrefix::-:: -->',
        '<!-- param::mode::github.com:: -->',
        '<!-- param::isNotitle::false:: -->',
        '<!-- param::maxHeaderLevel::8:: -->',
        '**Test title**',
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
        '',
        '<!-- END doctoc generated TOC please keep comment here to allow auto update -->',
      ],
    );
  });

  it('not override params', () => {
    const content = readFileSync(resolve(__dirname, 'fixtures/readme-with-params1.md'), 'utf8');
    const headers = transform(content, {isFolding: true, title: 'Test title'});

    expect(headers.wrappedToc.split('\n')).toEqual(
      [
        '<!-- START doctoc generated TOC please keep comment here to allow auto update -->',
        '<!-- DON\'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->',
        '<!-- param::entryPrefix::-:: -->',
        '<!-- param::mode::github.com:: -->',
        '<!-- param::isNotitle::false:: -->',
        '<!-- param::maxHeaderLevel::8:: -->',
        '<details>',
        '<summary>Test title</summary>',
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
        '',
        '</details>',
        '<!-- END doctoc generated TOC please keep comment here to allow auto update -->',
      ],
    );
  });
});
