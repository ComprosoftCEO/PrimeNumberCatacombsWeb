# Prime Number Catacombs - Web Version

Live version running on [GitHub Pages](https://comprosoftceo.github.io/PrimeNumberCatacombsWeb/)

_This code repository is still a work in progress._

<br />

## Compiling and Running

You will need to install the following tools:

- [Rust](https://www.rust-lang.org/tools/install)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

After cloning the repository, the first step is to compile the Rust code to WebAssembly.
This will put all the compiled WebAssembly and JavaScript code files into the `pkg/` directory.
Navigate to the `wasm/` directory (using `cd wasm`), then run the command:

```bash
wasm-pack build
```

Next, you will need to install all of the necessary dependencies to run the frontend codebase.
Navigate to the `site/` directory (using `cd site`), then run the command:

```bash
npm install
```

The project uses [Webpack](https://webpack.js.org/) to bundle all of the code files together.
If you wish to run the project on your local computer, run the command:

```bash
npm start
```

Otherwise, you can build static files using the command:

```bash
npm run build
```

All output files will be in the `build/` directory, which can be hosted on a static website.

The source code is written using [TypeScript](https://www.typescriptlang.org/) to add static typing to JavaScript.
As such, it must be compiled and bundled by Webpack before it can be run by the browser.
[Babel](https://babeljs.io/) is used to transpile the JavaScript code to be compatible with older browsers.
This project also uses [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to run static analysis on the code.
