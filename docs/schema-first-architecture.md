# Schema-First MVVM Architecture
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/schema-first-architecture.md)

## Overview
**Schema-First MVVM** is our architectural pattern where the **View (HTML)** and **ViewModel (JS)** together serve as the source of truth for the component. We adopt a strict **Model-View-ViewModel (MVVM)** separation to ensure scalability, maintainability, and a clear separation of concerns.

## The MVVM Triad

### 1. Model (`src/wb-models/`)
*   **What**: The Data Contract (Model Definition).
*   **Format**: JSON Schema (`*.schema.json`).
*   **Role**: Defines the *shape* of the data (properties, types, validation).
*   **Analogy**: Like a C# Class definition (`public class Card { ... }`). It defines the structure, but is not the object instance itself.
*   **Superpower**: Since all field definitions are here, we can use this to **auto-generate verification steps** for the real product. Mock data is reserved strictly for **injecting errors** and testing failure states.
*   **Note**: The **Model Instance** (the actual data) lives in the **View** (as HTML attributes) and the **ViewModel** (as runtime state).

### 2. View (`src/wb-views/`)
*   **What**: The Visual Structure.
*   **Format**: HTML Templates (`<template wb-view="...">`).
*   **Role**: Defines the DOM hierarchy, semantic tags, and initial layout.
*   **Example**: `card.html` defines `<article><header>...</header><main>...</main></article>`.

### 3. ViewModel (`src/wb-viewmodels/`)
*   **What**: The Interaction Logic.
*   **Format**: JavaScript Modules (`*.js`).
*   **Role**: The "Enhancer". It observes the View, binds event listeners, manages state, and handles user interaction. It **does not** build the DOM unless absolutely necessary (Builder Mode fallback).
*   **Example**: `card.js` attaches click handlers to the existing `<header>` defined in the View.

---

## Core Philosophy
1.  **View is King**: The HTML Template defines *what* a component looks like. The ViewModel must respect this structure.
2.  **ViewModel is the Servant**: The JavaScript logic defines *how* a component acts. It "hydrates" the existing View.
3.  **No DOM Destruction**: The ViewModel must never blindly overwrite the inner HTML of a View. It must attach to the existing structure (Enhancer Pattern).

## The "Enhancer" Pattern
In this architecture, a ViewModel (Behavior) has two modes:

*   **Enhancer Mode (Primary)**: "I see an existing View structure (e.g., `<header>`). I will attach my logic to it."
*   **Builder Mode (Fallback)**: "I see an empty container. I will use the Model (Schema) defaults to generate a standard View structure."

## Directory Structure

```
src/
├── wb-models/       # JSON Schemas (The Contract)
│   ├── card.schema.json
│   └── ...
├── wb-views/        # HTML Templates (The Structure)
│   ├── card.html
│   └── ...
├── wb-viewmodels/   # JavaScript Logic (The Behavior)
│   ├── card.js
│   └── ...
└── core/            # Engine Logic (The Binder)
```

## Implementation Plan

### Phase 1: Restructuring (Current)
*   Rename `src/parts/` to `src/wb-views/`.
*   Rename `src/behaviors/js/` to `src/wb-viewmodels/`.
*   Create `src/wb-models/` for schemas.
*   Update `wb-parts` concept to `wb-views`.

### Phase 2: Semantic Alignment
Ensure that Views and ViewModels speak the same language (Semantic HTML).
*   **Standard**: Define the "Contract" for each component.
    *   *Example*: A Card View MUST use `<article>`, `<header>`, `<main>`, `<footer>`.
*   **Action**: Update all `wb-views` templates to use these semantic tags.
*   **Action**: Update ViewModels to query these tags (e.g., `querySelector('header')`).

### Phase 3: Feature Parity
Ensure that the "View Path" and the "ViewModel Path" support the same features defined in the Model.
*   **Goal**: `new Card({ badge: 'New' })` (ViewModel) should render the same output as `<wb-view="card" badge="New">` (View).

### Phase 4: The Future
*   **Goal**: Developers primarily write **Views** (HTML) and **Models** (JSON).
*   **Result**: The system automatically binds the correct **ViewModel** logic.
