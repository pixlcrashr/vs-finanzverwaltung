// Package pagetoken provides simple AIP-158 page token encode/decode helpers
// for offset-based pagination (the project uses offset pagination in its
// existing repository layer).
//
// A page token encodes a single int (the byte-offset into the result set).
// Clients treat it as an opaque string; servers decode it to find the offset.
package pagetoken

import (
	"encoding/base64"
	"encoding/binary"
	"errors"
)

// Encode serialises offset into an opaque base64url page token.
func Encode(offset int64) string {
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, uint64(offset))
	return base64.RawURLEncoding.EncodeToString(buf)
}

// Decode recovers the offset from a page token produced by Encode.
// Returns (0, nil) for an empty token so callers can use it directly.
func Decode(token string) (int64, error) {
	if token == "" {
		return 0, nil
	}
	buf, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil {
		return 0, errors.New("invalid page token")
	}
	if len(buf) != 8 {
		return 0, errors.New("invalid page token length")
	}
	return int64(binary.BigEndian.Uint64(buf)), nil
}
