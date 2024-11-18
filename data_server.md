# Konfiguracja i uruchomienie serwera danych

1. Tworzenie środowiska testowego. Przy tworzeniu użytkownika pamiętać, że jego nazwa jest używana w ścieżkach w tej dokumentacji
    
    ```powershell
    wsl --list --online
    wsl --install openSUSE-Leap-15.6
    ```
    
2. Instalacja serwera WSGI (11.6MiB)
    
    ```bash
    sudo zypper refresh
    sudo zypper install apache2-mod_wsgi
    ```
    
3. Stworzenie skryptu
    
    ```bash
    import json
    import os
    
    def get_data():
        # Load frequency data from JSON file
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        try:
            with open(file_path, 'r') as file:
                data = json.load(file)
            return data
        except FileNotFoundError:
            return {"error": "File not found"}
        except json.JSONDecodeError:
            return {"error": "Error decoding JSON"}
    
    def application(environ, start_response):
        status = '200 OK'
        headers = [('Content-type', 'application/json')]
        start_response(status, headers)
    
        data = get_data()
        return [bytes(json.dumps(data), 'utf-8')]
    ```
    
    ```bash
    [
        {"date": "2007-04-23", "close": 93.24},
        {"date": "2007-04-24", "close": 95.35},
        {"date": "2007-04-25", "close": 98.84},
        {"date": "2007-04-26", "close": 99.92},
        {"date": "2007-04-29", "close": 99.8},
        {"date": "2007-05-01", "close": 99.47},
        {"date": "2007-05-02", "close": 100.39},
        {"date": "2007-05-03", "close": 100.4},
        {"date": "2007-05-04", "close": 100.81},
        {"date": "2007-05-07", "close": 103.92},
        {"date": "2007-05-08", "close": 105.06}
    ]
    ```
    
4. Konfiguracja ścieżki i uprawnień
    
    ```bash
    <VirtualHost *:80>
        WSGIDaemonProcess myapp threads=5
        WSGIScriptAlias / /home/karol/script.py
    
        <Directory /home/karol>
            WSGIProcessGroup myapp
            WSGIApplicationGroup %{GLOBAL}
            Require all granted
            
              Header set Access-Control-Allow-Origin "*"
    			    Header set Access-Control-Allow-Methods "GET, OPTIONS"
    			    Header set Access-Control-Allow-Headers "Content-Type"
        </Directory>
    </VirtualHost>
    ```
    
5. Konfiguracja bootowania systemd (WSL specific)
    
    ```bash
    [boot]
    systemd=true
    
    [network]
    hostname=proj
    
    [user]
    default=karol
    ```
    
    ```bash
    exit
    wsl --shutdown
    wsl -d openSUSE-Leap-15.6
    cd ~
    ```
    
6. Pozostało włączenie modułu headers oraz wystartowanie serwera apache2
    
    ```bash
    sudo a2enmod headers
    sudo systemctl start apache2
    ```
    
7. Za pomocą przeglądarki lub Postman’a można sprawdzić czy wszystko działa wpisując adres [`localhost/data`](http://localhost/data) lub `<adres_na_wsl>/data`