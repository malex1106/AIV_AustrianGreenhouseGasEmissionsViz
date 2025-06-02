# Observable Framework Example


This is an [Observable Framework](https://observablehq.com/framework/) app. To install the required dependencies, run:

```
npm install
```

Then, to start the local preview server, run:

```
npm run dev
```

Then visit <http://localhost:3000> to preview your app.

For more, see <https://observablehq.com/framework/getting-started>.

## Project structure

A typical Framework project looks like this:

```ini
.
├─ src
│  ├─ components
│  │  └─ timeline.js           # an importable module
│  ├─ data
│  │  ├─ launches.csv.js       # a data loader
│  │  └─ events.json           # a static data file
│  ├─ example-dashboard.md     # a page
│  ├─ example-report.md        # another page
│  └─ index.md                 # the home page
├─ .gitignore
├─ observablehq.config.js      # the app config file
├─ package.json
└─ README.md
```

**`src`** - This is the “source root” — where your source files live. Pages go here. Each page is a Markdown file. Observable Framework uses [file-based routing](https://observablehq.com/framework/project-structure#routing), which means that the name of the file controls where the page is served. You can create as many pages as you like. Use folders to organize your pages.

**`src/index.md`** - This is the home page for your app. You can have as many additional pages as you’d like, but you should always have a home page, too.

**`src/data`** - You can put [data loaders](https://observablehq.com/framework/data-loaders) or static data files anywhere in your source root, but we recommend putting them here.

**`src/components`** - You can put shared [JavaScript modules](https://observablehq.com/framework/imports) anywhere in your source root, but we recommend putting them here. This helps you pull code out of Markdown files and into JavaScript modules, making it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`observablehq.config.js`** - This is the [app configuration](https://observablehq.com/framework/config) file, such as the pages and sections in the sidebar navigation, and the app’s title.

## Command reference

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm install`            | Install or reinstall dependencies                        |
| `npm run dev`        | Start local preview server                               |
| `npm run build`      | Build your static site, generating `./dist`              |
| `npm run deploy`     | Deploy your app to Observable                            |
| `npm run clean`      | Clear the local data loader cache                        |
| `npm run observable` | Run commands like `observable help`                      |


## Additional Information

For this example, we made minimal additions and changes to the template files.
We added an interpreter configuration to the `observablehq.config.js` file to make sure that the correct Python path for Windows is used.
We also added a dataset (`data/aiv-ss25-pokemon.csv`) along with a data loader (`data/pokemon.json.py`) that loads the CSV and provides a JSON version of it.

In the newly added app page (`notebook-reuse.md`), we access that data and create a stacked bar plot from it.
The original notebook code was the following:

```js
// Cell 1
pokemon = FileAttachment("aiv-ss25-pokemon.csv").csv()

// Cell 2
// Observable Table cell for creating a typed version pokemonTyped

// Cell 3
pokeScatter = Plot.plot({
  marks: [Plot.dot(pokemonTyped, { x: "speed", y: "hp", stroke: "type1" })]
})

// Cell 4
pokeBar = Plot.plot({
  color: {
    legend: true
  },
  marks: [
    Plot.rectY(
      pokemonTyped,
      Plot.binX({ y: "count" }, { x: "speed", fill: "type1" })
    ),
    Plot.ruleY([0])
  ],
  y: {
    domain: [0, yMax]
  }
})

// Cell 5
viewof yMax = Inputs.range([1, 150], { label: "Y Max", step: 1 })
```

Check out the code blocks in the markdown file `notebook-reuse.md` to understand the differences between Observable JS and vanilla JS, in particular the variable definitions and the use if `view(...)`.