PYTHON ?= python
VENV_PYTHON := .venv/bin/python
WINDOWS_VENV_PYTHON := .venv/Scripts/python.exe

ifeq ($(OS),Windows_NT)
PYTEST_PYTHON := $(WINDOWS_VENV_PYTHON)
else
PYTEST_PYTHON := $(VENV_PYTHON)
endif

ifeq ("$(wildcard $(PYTEST_PYTHON))","")
PYTEST_PYTHON := $(PYTHON)
endif

.PHONY: test docker-test

test:
	$(PYTEST_PYTHON) -m pytest

# Kept for CI compatibility: workflows already call `make docker-test`.
docker-test: test
