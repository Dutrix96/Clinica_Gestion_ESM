.PHONY: help install back-install front-install seed check build back front dev clean

help:
	@echo "Comandos disponibles:"
	@echo "  make install      Instala dependencias de back y front"
	@echo "  make seed         Carga datos de prueba en MySQL y MongoDB"
	@echo "  make back         Arranca el servidor Node/Express"
	@echo "  make front        Arranca el cliente React"
	@echo "  make dev          Arranca back y front en paralelo"
	@echo "  make check        Comprueba sintaxis del backend"
	@echo "  make build        Compila el frontend React"
	@echo "  make clean        Borra builds generadas"

install: back-install front-install

back-install:
	cd back && npm install

front-install:
	cd front && npm install

seed:
	cd back && npm run seed

check:
	cd back && npm run check

build:
	cd front && npm run build

back:
	cd back && npm start

front:
	cd front && npm run dev

dev:
	$(MAKE) -j2 back front

clean:
	cd front && node -e "fs.rmSync('dist', { recursive: true, force: true })"
