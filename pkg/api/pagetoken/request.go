package pagetoken

import (
	"fmt"
)

// Request is an interface that must be implemented by all request types that
// use page tokens.
type Request interface {
	// GetChecksumFields returns a list of functions that build the checksum for the request.
	GetChecksumFields() []func(*ChecksumBuilder)
	// GetPageToken returns the page token from the request.
	GetPageToken() string
}

func FromRequest(e *Encryptor, req Request, checksumOpts ...ChecksumBuilderOpt) (*Cursor, error) {
	t := req.GetPageToken()
	var c *Cursor

	if t == "" {
		// create a newly initialized cursor
		c = &Cursor{}
		cb := NewChecksumBuilder(checksumOpts...)
		for _, field := range req.GetChecksumFields() {
			field(cb)
		}
		crc, err := cb.Build()
		if err != nil {
			return nil, err
		}
		c.checksum = crc
		c.encryptor = e
		c.fields = []CursorField{}
		return c, nil
	}

	c, err := ParseCursor(e, t)
	if err != nil {
		return nil, err
	}

	// verify request checksum with page token checksum
	cb := NewChecksumBuilder(checksumOpts...)
	for _, field := range req.GetChecksumFields() {
		field(cb)
	}
	crc, err := cb.Build()
	if err != nil {
		return nil, err
	}

	if crc != c.checksum {
		return nil, fmt.Errorf(
			"checksum mismatch (got 0x%x but expected 0x%x)", c.checksum, crc,
		)
	}

	return c, nil
}
