# Jak używać skryptu serialize_data.py
Aby użyć skryptu należy wywołać go za pomocą interpretera python z następującymi argumentami pozycyjnymi (kolejność ma znaczenie):
1. Ścieżka do pliku z próbkami sygnału (float32)
2. Okres próbkowania (w sekundach)

# Przykładowe użycie
Poniższe wywołanie skryptu wypisze na konsoli w postaci JSON próbki sygnału z pliku "WAR_2024-10-21_10:04:01" (należy zwrócić uwagę na odwołanie znaków specjalnych), zakładając okres próbkowania 5 sekund
```
python3.10 serialize_data.py ../../test_data/WAR_2024-10-21_10\:04\:01 5
```