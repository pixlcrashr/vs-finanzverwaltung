package pagetoken

import (
	"bytes"
	"encoding/json"
	"hash/crc32"
)

const DefaultChecksumMask = 0x58AEF322

func checksum(data []byte, mask uint32) uint32 {
	return crc32.ChecksumIEEE(data) ^ mask
}

type ChecksumBuilder struct {
	mask   uint32
	fields []string
}

func NewChecksumBuilder(opts ...ChecksumBuilderOpt) *ChecksumBuilder {
	cb := &ChecksumBuilder{
		mask:   DefaultChecksumMask,
		fields: make([]string, 0),
	}

	for _, opt := range opts {
		opt(cb)
	}

	return cb
}

func (b *ChecksumBuilder) Build() (uint32, error) {
	bs := bytes.NewBuffer(nil)
	if err := json.NewEncoder(bs).Encode(b.fields); err != nil {
		return 0, err
	}

	return checksum(bs.Bytes(), b.mask), nil
}

type ChecksumBuilderOpt func(*ChecksumBuilder)

func ChecksumMask(mask uint32) ChecksumBuilderOpt {
	return func(cb *ChecksumBuilder) {
		cb.mask = mask
	}
}

func ChecksumField(key, value string) ChecksumBuilderOpt {
	return func(cb *ChecksumBuilder) {
		cb.fields = append(cb.fields, key, value)
	}
}
