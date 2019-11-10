const checked = Symbol('assert-checked');
const assert = {
	deepEqual: function(input, expected, message=''){
		var keysInput = Object.keys(input).sort(), keysExpected = Object.keys(expected).sort();
		var i = 0, len = Math.max(keysInput.length, keysExpected.length), result = [], key;
		while(i<len){
			key = keysInput[i] || keysExpected[i];
			result[i] = this.equal(input[key], expected[key], message);
			i++;
		};
		return result;
	}
	,equal: function(input, expected, message=''){
		var result = false;
		if(input == expected){
			result = true;
		}else if(input && typeof input === typeof expected){
			// prevent cyclic references
			if(input[checked]) return input;
			input[checked] = true;
			return this.deepEqual(input, expected, message);
		};
		console.assert(result, message);
		return result;
	}
};

import {
  jsxToText,
  jsxToTextWith,
  parse,
  parseJSX,
  render
} from '../src/litJSX.js';
self.jsxToText = jsxToText;

function it(should, how){
	console.log(should, how.name);
	return how();
}
function xit(should, how){
	console.warn(`xit(${should})`, how);
	return;
}
function describe(thing, how){
	console.log(thing+'...');
	return [thing, how()];
}

function Bold(props) {
  return `<b>${props.children}</b>`;
}
self.Bold = Bold;


describe("litJSX", () => {

  it("parses sequences with single substitution", () => {
    const data = parse([
      `<div>`,
      `</div>`
    ]);
    assert.deepEqual(data, [
      'div',
      {},
      [
        0,
      ]
    ]);
  });

  it("parses sequences with mutliple substitutions", () => {
    const data = parseJSX(`<div>[[[0]]]foo[[[1]]]</div>`);
    assert.deepEqual(data, [
      'div',
      {},
      [
        0,
        'foo',
        1
      ]
    ]);
  });

  it("parses attributes", () => {
    const data = parse([
      `<div class="`,
      `"></div>`
    ]);
    assert.deepEqual(data, [
      'div',
      {
        'class': 0
      },
      []
    ]);
  });

  it("parses embedded component", () => {
    const data = parse([
      `<span>Hello, <Bold>`,
      `</Bold>.</span>`
    ]);
    assert.deepEqual(data, [
      'span',
      {},
      [
        'Hello, ',
        [
          Bold,
          {},
          [
            0
          ]
        ],
        '.'
      ]
    ]);
  });

  it("flattens nodes with no substitutions", () => {
    const data = parse([
      `<div><img src="foo.jpg"/><i>Hello, </i><b>`,
      `</b></div>`
    ]);
    assert.deepEqual(data, [
      'div',
      {},
      [
        '<img src="foo.jpg"><i>Hello, </i>',
        [
          'b',
          {},
          [
            0
          ]
        ]
      ]
    ]);
  });

  it("can render data + values", () => {
    const data = parse([
      `<span>Hello, <Bold>`,
      `</Bold>.</span>`
    ]);
    const result = render(data, ['world']);
    assert.equal(result, '<span>Hello, <b>world</b>.</span>');
  });

  it("provides tag template literal", () => {
    const name = 'world';
    const text = jsxToText`<span>Hello, <Bold>${name}</Bold>.</span>`;
    assert.equal(text, '<span>Hello, <b>world</b>.</span>');
  });

  it("can construct a template literal for text that handles specific classes", () => {
    const Italic = (props) => `<i>${props.children}</i>`;
    const html = jsxToTextWith({ Italic });
    const text = html`<Italic>foo</Italic>`;
    assert.equal(text, `<i>foo</i>`);
  });

  it("can render attributes", () => {
    const html = jsxToText;
    const value = 'foo';
    const text = html`<div class="${value}"></div>`;
    assert.equal(text, `<div class="foo"></div>`);
  });

  it("can concatenate strings to construct an attribute value", () => {
    const html = jsxToText;
    const value = 'foo';
    const text = html`<div class="${value} bar"></div>`;
    assert.equal(text, `<div class="foo bar"></div>`);
  });

  it("can pass objects to parameters identified as if they were attributes", () => {
    const LastFirst = props => jsxToText`<span>${props.name.last}, ${props.name.first}</span>`;
    const name = {
      first: 'Jane',
      last: 'Doe'
    };
    const html = jsxToTextWith({ LastFirst });
    const text = html`<LastFirst name="${name}"/>`;
    assert.equal(text, `<span>Doe, Jane</span>`);
  });

  it("can render async components", async () => {
    const Async = props => Promise.resolve(`*${props.children}*`);
    const text = await jsxToTextWith({ Async })`<Async>test</Async>`;
    assert.equal(text, `*test*`);
  });

  it("waits for async components in parallel", async () => {
    const Async = async (props) => {
      const delay = parseInt(props.delay);
      await new Promise(resolve => setTimeout(resolve, delay));
      return `[${props.children}]`;
    };
    const html = jsxToTextWith({ Async });
    const text = await html`
      <span>
        <Async delay="200">One</Async>
        <Async delay="100">Two</Async>
      </span>
    `;
    assert.equal(text, `<span> [One] [Two] </span>`);
  });

  it("can handle multiple top-level elements", () => {
    const text = jsxToText`<Bold>${'One'}</Bold><Bold>${'Two'}</Bold>`;
    assert.equal(text, '<b>One</b><b>Two</b>');
  });

  xit("can handle document type nodes", () => {
    const text = jsxToText`<!doctype html>`;
    assert.equal(text, `<!DOCTYPE html>`);
  });

  it("can handle comments", () => {
    const text = jsxToText`<!-- Hello -->`;
    assert.equal(`<!--${text}-->`, `<!-- Hello -->`);
  });

  it("leaves named HTML entities alone", () => {
    const text = jsxToText`&lt;`;
    assert.equal(text, `&lt;`);
  });

  it("handles JSX that is only substitutions", () => {
    const a = 0;
    const b = 1;
    const text = jsxToText`${a}${b}`;
    assert.equal(text, '01');
  });

  it('renders an array', () => {
    const a = [
      'Hello',
      'world'
    ];
    const text = jsxToText`${a}`;
    assert.equal(text, 'Helloworld');
  });

});
