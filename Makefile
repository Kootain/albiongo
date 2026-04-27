JS_CODES_IN := pkg/protocol/codes.go
JS_CODES_OUT := front/test/codes.generated.js

.PHONY: gen-code
gen-code: gen-go-code gen-js-codes

.PHONY: gen-go-code
gen-go-code:
	go generate ./...

.PHONY: gen-js-codes
gen-js-codes: $(JS_CODES_OUT)

$(JS_CODES_OUT): $(JS_CODES_IN) cmd/gen_js_codes/main.go
	go run ./cmd/gen_js_codes -in $(JS_CODES_IN) -out $(JS_CODES_OUT)
