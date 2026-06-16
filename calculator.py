def calculate(expression):
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return result
    except ZeroDivisionError:
        return "Error: Division by zero"
    except Exception:
        return "Error: Invalid expression"

def main():
    print("Calculator (type 'quit' to exit)")
    print("Supports: +, -, *, /, **, (, )")
    while True:
        expr = input("\n> ").strip()
        if expr.lower() in ("quit", "exit", "q"):
            break
        if not expr:
            continue
        print(f"= {calculate(expr)}")

if __name__ == "__main__":
    main()
