# WB Builder Properties Panel

> **Version:** 2.0.0  
> **Last Updated:** 2026-01-18  
> **Status:** Active

## Overview

The Properties Panel is the right-side panel in the WB Builder that allows users to edit component properties. It provides a **flat, always-visible** view of all editable properties for the selected component.

---

## Design Principles

### 1. FLAT DISPLAY
All categories and their options are **always visible**. No collapsing, no hiding.

### 2. NO SUBMENUS
Categories show their label with options directly below. Never nest options in expandable sections.

### 3. IMMEDIATE FEEDBACK
All changes apply instantly to the canvas. No save button needed.

### 4. DEV MODE
No alerts, prompts, or toasts. Console logging only.

---

## Panel Structure

When a component is selected, the Properties Panel shows **ALL attributes** of the element:

...existing code...
