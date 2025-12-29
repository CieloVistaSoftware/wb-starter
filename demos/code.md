# Code Highlighting Demo

## Inline Code

This is `const x = 10;` inline code.

## Block Code (JS)

```javascript
function hello() {
  console.log("Hello World");
  return true;
}
```

## Block Code (HTML)

```html
<div class="container">
  <h1>Title</h1>
  <p>Content</p>
</div>
```

## Block Code (CSS)

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

## Block Code (Python)

```python
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

print([fibonacci(i) for i in range(10)])
```

## Block Code (C#)

```csharp
using System;

public class Program
{
    public static void Main()
    {
        Console.WriteLine("Hello World");
        var numbers = new [] { 1, 2, 3, 4, 5 };
        foreach(var n in numbers) 
        {
            Console.WriteLine($"Number: {n}");
        }
    }
}
```

## Block Code (Java)

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        for (int i = 0; i < 5; i++) {
            System.out.println("Count: " + i);
        }
    }
}
```

## User Examples

### JavaScript

```javascript
// JavaScript example
const greeting = "Hello, World!";
function sayHello(name) {
  return `Hello, ${name}!`;
}
console.log(sayHello("Developer"));
```

### HTML

```html
<!-- HTML example -->
<button data-wb="ripple tooltip" data-tooltip="Click me!">
  Interactive Button
</button>
```
