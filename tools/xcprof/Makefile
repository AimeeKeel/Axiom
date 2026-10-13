BINARY := xcprof
OUTDIR := ../../.claude-plugin/plugins/axiom/bin
BIN := $(OUTDIR)/$(BINARY)

.PHONY: all build install test fuzz clean

all: build

build:
	GOARCH=arm64 GOOS=darwin go build -trimpath -ldflags "-s -w" -o $(BINARY) .
	@file $(BINARY)

install: build
	install -m 755 $(BINARY) $(BIN)
	@echo "Installed to $(BIN)"
	@file $(BIN)

test:
	go test -v ./...

fuzz:
	go test -fuzz=FuzzParseCPUProfile -fuzztime=60s

clean:
	rm -f $(BINARY)
