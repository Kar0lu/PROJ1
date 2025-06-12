#!/bin/sh

# Wczytanie nazwy użytkownika z argumentu wywołania, jeśli go podano, w innym wypadku ustawienie jej na wk
u="${1:-wk}"

# Zmiana katalogu na katalog w którym znajduje się skrypt
cd $( dirname -- "$( readlink -f -- "$0" )")  

# Sprawdzenie czy skrypt ma odpowiednie uprawnienia
if [ "$(id -u)" -ne 0 ]; then
    echo "Ten skrypt wymaga uprawnień roota."
    exit 1
fi

# Sprawdzanie czy openvpn jest już zainstalowany
rpm -q openvpn > /dev/null 2>&1
if [ $? -ne 0 ]; then
    # Zainstalowanie go, jeśli go nie ma
    echo "OpenVPN nie jest zainstalowany. Instaluję..."
    zypper --non-interactive install openvpn
    # Zakończenie skryptu, jeśli instalacja się nie powiedzie
    if [ $? -ne 0 ]; then
        echo "Błąd podczas instalacji OpenVPN."
        exit 1
    fi
fi

# Sprawdzanie czy moduł tun jest załadowany
grep -q '^tun ' /proc/modules
if [ $? -eq 0 ]; then
    echo "Moduł tun jest załadowany"

    # Sprawdzanie czy istnieje interfejs tunelowy do połączenia openvpn
    if [ ! -e /dev/net/tun ]; then
        echo "Moduł tun jest załadowany, ale plik urządzenia nie został stworzony, kończenie..."
        exit 1
    fi

# Moduł tun nie jest załadowany, jeszcze (prawdopodobnie) da się odratować sytuację
else
    echo "Próba załadowania modułu tun"
    modprobe tun

    # Ponowne sprawdzenie istnienia interfejsu
    if [ ! -e /dev/net/tun ]; then
        echo "Załadowano moduł, ale interfejsu dalej nie ma, kończenie..."
        exit 1
    fi
fi


# Kopiowanie konfiguracji openvpn
cp ./client.conf /etc/openvpn/

# Łączenie z VPN i sprawdzenie czy adres został poprawnie przypisany do adaptera
systemctl start openvpn@client >/dev/null 2>&1

# Czekamy na przypisanie IP (max 30 sekund)
timeout=30
while [ $timeout -gt 0 ]; do
    if ip a | grep -q "10.0.0.30"; then
        echo "Pomyślnie połączono z VPN, dodawanie openvpn do startu przy uruchomieniu"
        systemctl enable openvpn@client
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if ! ip a | grep -q "10.0.0.30"; then
    echo "Nie uzyskano oczekiwanego adresu IP, kończenie..."
    exit 1
fi

# Sprawdzanie czy daemon SSH jest uruchomiony
systemctl status sshd >/dev/null 2>&1 || { echo "Nie znaleziono daemona ssh, kończenia..." && exit 1; }
if [ $? -ne 0 ]; then
    systemctl start sshd
    systemctl enable sshd
fi

# Tworzenie klucza SSH
yes | su $u -c "ssh-keygen -f ~/.ssh/PROJ_key -N ''"

# Autoryzacja klucza (dla użytkownika podanego w pierwszym argumencie)
cat /home/$u/.ssh/PROJ_key.pub >> /home/$u/.ssh/authorized_keys

# Skopiowanie pary kluczy do folderu ze skryptem
cp /home/$u/.ssh/PROJ_key* .

# Usunięcie kluczy z folderu .ssh
rm /home/$u/.ssh/PROJ_key*

# Sprawdzanie poprawności wygenerowanych kluczy
ssh -q -o BatchMode=true -o StrictHostKeychecking=no -i ./PROJ_key $u@10.0.0.30 exit

if [ $? -eq 0 ]; then
    echo "Klucz wygenerowano poprawnie"
    exit 0
fi

echo "Klucz nie działa, kończenie..."
exit 1
