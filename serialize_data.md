# Jak używać skryptu serialize_data.py
Aby użyć skryptu należy wywołać funkcję main(path, sample_period) z argumentami:
1. path - Ścieżka bezwzględna do przetwarzanego pliku
2. sample_period - Okres próbkowania (w sekundach)

# Co zwraca skrypt?
Skrypt zwraca text/JSON, w formacie:
```
[
    {
        "date": <datetime>,
        "close": <wartość_próbki>
    }
]
```