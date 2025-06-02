---
title: Reusing notebook code
---

# Reusing Code from Observable Notebooks

In our Observable Notebook tutorial, we created a stacked bar chart of our Pokémon dataset.
Here we use a simple Python data loader that uses Pandas to load out Pokémon dataset and then provides the data in JSON format.
We then reuse our code from the notebook, adapting the `viewof` part to work within the vanilla JavaScript used in Observable Framework.

```js
const pokemon = FileAttachment("./data/pokemon.json").json();
```

```js
const pokeBar = Plot.plot({
  color: {
    legend: true
  },
  marks: [
    Plot.rectY(
      pokemon,
      Plot.binX({ y: "count" }, { x: "speed", fill: "type1" })
    ),
    Plot.ruleY([0])
  ],
  y: {
    domain: [0, yMax]
  }
});

display(pokeBar);
```

```js
const yMax = view(
    Inputs.range([1, 150], { label: "Y Max", step: 1 })
)
```