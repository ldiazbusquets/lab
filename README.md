# LDB Lab

**Machine learning you can watch think.** A hands-on applied-AI lab by Luis Diaz Busquets, where every model runs live in your browser.

**Live site:** https://ldiazbusquets.github.io/lab/

## What's inside

| Section | What it is |
|---|---|
| **Course** (14 modules) | From fitting a line and gradient descent to neural networks, transformers, diffusion, GPUs, serving, retrieval, agents and evaluation. Every module is interactive. |
| **Finance tools** (4) | Options builder (Black-Scholes and the Greeks), a market-making game with Bayesian quoting, the Kelly betting challenge, and a Model Playground where FinBERT, BERT, Qwen3 and Llama 3.2 read the same financial headline side by side. |
| **AI workbenches** (3) | Inference benchmark: SmolLM2 timed on the processor and the graphics chip at q4, fp16 and fp32. Evaluation arena: small open models on 22 auto-graded questions. Retrieval workbench: chunk any document, search it by keyword (BM25), meaning (MiniLM embeddings) or both, and test retrieval accuracy and honest refusals against questions with known answers. |
| **Learning agents** (5) | A Q-learning market trader, a neural-network day trader, a sports-market rating model, a Monte Carlo planner and a genetic-algorithm board-game player. Each one trains live and is judged on data it never saw. |
| **Vision** | Real object detection (YOLOX) on licensed stock footage, running on-device with ONNX Runtime Web: multi-object tracking, automatic face blurring, a motion detector for traffic cameras, and a thermal view. |

## How it works

- Plain HTML, CSS and JavaScript, with no build step and no server. GitHub Pages serves the files as they are.
- Models run in the visitor's browser. The Model Playground downloads its models from Hugging Face on first use; the chat models need WebGPU. There are no accounts, cookies or tracking.
- The theme follows the clock: light from 7 am to 7 pm and dark otherwise, with a toggle in the header.

## Folders

- `feeds/`: the stock video clips for the vision demo
- `models/`: the object-detection and face models (see `models/NOTICE.txt` for licences)
- `llm/`: the small transformer used in the "How an LLM works" module
- `img/`: images for the home page

All market, trading and portfolio results on the site use simulated data. Nothing here is investment advice.
