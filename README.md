# LDB Lab

**Machine learning you can watch think.** A hands-on applied-AI lab by Luis Diaz Busquets, where every model runs live in your browser.

**Live site:** https://ldiazbusquets.github.io/lab/

## What's inside

| Section | What it is |
|---|---|
| **Course** (14 modules) | From fitting a line and gradient descent to neural networks, transformers, diffusion, GPUs, serving, retrieval, agents and evaluation. Every module is interactive. |
| **Finance tools** (3) | Options builder (Black-Scholes and the Greeks), a market-making game with Bayesian quoting, and the Kelly betting challenge. |
| **Learning agents** (5) | A Q-learning market trader, a neural-network day trader, a sports-market rating model, a Monte Carlo planner and a genetic-algorithm board-game player. Each one trains live and is judged on data it never saw. |
| **Vision** | Real object detection (YOLOX) on licensed stock footage, running on-device with ONNX Runtime Web: multi-object tracking, automatic face blurring, a motion detector for traffic cameras, and a thermal view. |
| **Games** (7) | Blackjack, Texas Hold'em, chess, two UNO-chess variants, Minesweeper and Connect Four, each with the maths switched on: expected value, equity, search and exact probabilities. |

## How it works

- Plain HTML, CSS and JavaScript, with no build step and no server. GitHub Pages serves the files as they are.
- Models run in the visitor's browser. There are no accounts, cookies or tracking.
- The theme follows the clock: light from 7 am to 7 pm and dark otherwise, with a toggle in the header.

## Folders

- `feeds/`: the stock video clips for the vision demo
- `models/`: the object-detection and face models (see `models/NOTICE.txt` for licences)
- `llm/`: the small transformer used in the "How an LLM works" module
- `img/`: images for the home page

All market, trading and portfolio results on the site use simulated data. Nothing here is investment advice.
