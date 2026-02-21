package pagetoken

import (
	"encoding/json"
	"strconv"
)

func ParseCursor(e *Encryptor, token string) (*Cursor, error) {
	d, err := e.Decrypt(token)
	if err != nil {
		return nil, err
	}

	var ps []string
	if err := json.Unmarshal(d, &ps); err != nil {
		return nil, err
	}

	crc, err := strconv.ParseUint(ps[len(ps)-1], 10, 64)
	if err != nil {
		return nil, err
	}

	fs := []CursorField{}
	for i := 0; i < len(ps)-1; i += 3 {
		o, err := ParseOrder(ps[i+2])
		if err != nil {
			return nil, err
		}

		fs = append(fs, CursorField{
			Path:  ps[i],
			Value: ps[i+1],
			Order: o,
		})
	}

	return &Cursor{
		checksum:  uint32(crc),
		encryptor: e,
		fields:    fs,
	}, nil
}
