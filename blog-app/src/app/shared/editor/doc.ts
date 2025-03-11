export default {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: {
          level: 2,
          align: null,
        },
        content: [
          {
            type: 'text',
            text: 'The code block is a code editor',
          },
        ],
      },
      {
        type: 'paragraph',
        attrs: {
          align: null,
        },
        content: [
          {
            type: 'text',
            text: 'This editor has been wired up to render code blocks as instances of the ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://codemirror.net',
                  title: 'https://codemirror.net',
                  target: '_blank',
                },
              },
            ],
            text: 'CodeMirror',
          },
          {
            type: 'text',
            text: ' code editor, which provides ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://en.wikipedia.org',
                  title: '',
                  target: '_blank',
                },
              },
            ],
            text: 'syntax highlighting',
          },
          {
            type: 'text',
            text: ', auto-indentation, and similar.',
          },
        ],
      },
      {
        type: 'code_mirror',
        content: [
          {
            type: 'text',
            text: 'function max(a, b) {\n  return a > b ? a : b;\n}',
          },
        ],
      },
    ],
  };
  