package auth

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"os"

	"github.com/go-jose/go-jose/v3"
	"github.com/pixlcrashr/vsfv/pkg/cfg"
)

// KeyManager holds the private and public JWKS used for signing and publishing
// OIDC tokens (ID tokens).
type KeyManager struct {
	// signingKey is the first private key, passed to fosite for signing.
	signingKey interface{}
	// privateJWKS contains the private keys.
	privateJWKS *jose.JSONWebKeySet
	// publicJWKS contains only public keys; served at /.well-known/jwks.json.
	publicJWKS *jose.JSONWebKeySet
	// signingAlgorithms lists the algorithms supported by the loaded keys.
	signingAlgorithms []string
}

// LoadKeys reads PEM files from the config and builds a KeyManager.
func LoadKeys(jwksCfg cfg.JWKSConfig) (*KeyManager, error) {
	privateJWKS := &jose.JSONWebKeySet{}
	publicJWKS := &jose.JSONWebKeySet{}
	algSet := map[string]bool{}

	if len(jwksCfg.KeyFiles) == 0 {
		// Auto-generate one RSA 2048 and one EC P-256 key.
		rsaKey, err := rsa.GenerateKey(rand.Reader, 2048)
		if err != nil {
			return nil, fmt.Errorf("generating RSA key: %w", err)
		}

		ecKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		if err != nil {
			return nil, fmt.Errorf("generating EC key: %w", err)
		}

		for _, key := range []interface{}{rsaKey, ecKey} {
			alg, err := algorithmForKey(key)
			if err != nil {
				return nil, fmt.Errorf("determining algorithm for generated key: %w", err)
			}

			kid, err := keyIDForKey(key, alg)
			if err != nil {
				return nil, fmt.Errorf("computing key ID for generated key: %w", err)
			}

			privJWK := jose.JSONWebKey{
				Key:       key,
				KeyID:     kid,
				Algorithm: alg,
				Use:       "sig",
			}
			privateJWKS.Keys = append(privateJWKS.Keys, privJWK)
			publicJWKS.Keys = append(publicJWKS.Keys, privJWK.Public())
			algSet[alg] = true
		}
	} else {
		for _, path := range jwksCfg.KeyFiles {
			pemData, err := os.ReadFile(path)
			if err != nil {
				return nil, fmt.Errorf("reading key file %s: %w", path, err)
			}

			key, err := parsePEMKey(pemData)
			if err != nil {
				return nil, fmt.Errorf("parsing key file %s: %w", path, err)
			}

			alg, err := algorithmForKey(key)
			if err != nil {
				return nil, fmt.Errorf("determining algorithm for key file %s: %w", path, err)
			}

			kid, err := keyIDForKey(key, alg)
			if err != nil {
				return nil, fmt.Errorf("computing key ID for file %s: %w", path, err)
			}

			privJWK := jose.JSONWebKey{
				Key:       key,
				KeyID:     kid,
				Algorithm: alg,
				Use:       "sig",
			}
			privateJWKS.Keys = append(privateJWKS.Keys, privJWK)
			publicJWKS.Keys = append(publicJWKS.Keys, privJWK.Public())
			algSet[alg] = true
		}
	}

	var algs []string
	for alg := range algSet {
		algs = append(algs, alg)
	}

	return &KeyManager{
		signingKey:        privateJWKS.Keys[0].Key,
		privateJWKS:       privateJWKS,
		publicJWKS:        publicJWKS,
		signingAlgorithms: algs,
	}, nil
}

// PrivateJWKS returns the JSONWebKeySet containing private keys.
func (km *KeyManager) PrivateJWKS() *jose.JSONWebKeySet {
	return km.privateJWKS
}

// SigningKey returns the raw private key used for signing tokens.
func (km *KeyManager) SigningKey() interface{} {
	return km.signingKey
}

// PublicJWKS returns the JSONWebKeySet containing only public keys.
func (km *KeyManager) PublicJWKS() *jose.JSONWebKeySet {
	return km.publicJWKS
}

// SigningAlgorithms returns the list of supported signing algorithms.
func (km *KeyManager) SigningAlgorithms() []string {
	return km.signingAlgorithms
}

func parsePEMKey(pemData []byte) (interface{}, error) {
	block, _ := pem.Decode(pemData)
	if block == nil {
		return nil, fmt.Errorf("no PEM block found in key data")
	}

	switch block.Type {
	case "PRIVATE KEY":
		key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("parsing PKCS8 private key: %w", err)
		}
		return key, nil
	case "RSA PRIVATE KEY":
		key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("parsing PKCS1 RSA private key: %w", err)
		}
		return key, nil
	case "EC PRIVATE KEY":
		key, err := x509.ParseECPrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("parsing EC private key: %w", err)
		}
		return key, nil
	default:
		return nil, fmt.Errorf("unsupported PEM block type: %s", block.Type)
	}
}

func algorithmForKey(key interface{}) (string, error) {
	switch k := key.(type) {
	case *rsa.PrivateKey:
		return "RS256", nil
	case *ecdsa.PrivateKey:
		switch k.Curve {
		case elliptic.P256():
			return "ES256", nil
		case elliptic.P384():
			return "ES384", nil
		case elliptic.P521():
			return "ES521", nil
		default:
			return "", fmt.Errorf("unsupported EC curve: %s", k.Curve.Params().Name)
		}
	default:
		return "", fmt.Errorf("unsupported key type: %T", key)
	}
}

func keyIDForKey(key interface{}, alg string) (string, error) {
	var pubBytes []byte
	switch k := key.(type) {
	case *rsa.PrivateKey:
		pubBytes = rsaPublicKeyBytes(k.PublicKey)
	case *ecdsa.PrivateKey:
		pubBytes = ecdsaPublicKeyBytes(k.PublicKey)
	default:
		return "", fmt.Errorf("unsupported key type for KID: %T", key)
	}

	if pubBytes == nil {
		return "", fmt.Errorf("failed to marshal public key for KID")
	}

	hash := sha256.Sum256(pubBytes)
	return base64.RawURLEncoding.EncodeToString(hash[:]), nil
}

func rsaPublicKeyBytes(pub rsa.PublicKey) []byte {
	// JWK thumbprint per RFC 7638 for RSA: {"e":"...","kty":"RSA","n":"..."}
	n := pub.N.Bytes()
	e := make([]byte, 4)
	binaryBigEndian(e, uint32(pub.E))
	e = bytesTrimLeadingZeros(e)

	jsonStr := fmt.Sprintf(`{"e":"%s","kty":"RSA","n":"%s"}`,
		base64.RawURLEncoding.EncodeToString(e),
		base64.RawURLEncoding.EncodeToString(n),
	)
	return []byte(jsonStr)
}

func ecdsaPublicKeyBytes(pub ecdsa.PublicKey) []byte {
	// JWK thumbprint per RFC 7638 for EC: {"crv":"...","kty":"EC","x":"...","y":"..."}
	crv := ""
	switch pub.Curve {
	case elliptic.P256():
		crv = "P-256"
	case elliptic.P384():
		crv = "P-384"
	case elliptic.P521():
		crv = "P-521"
	default:
		return nil
	}

	fieldSize := (pub.Curve.Params().BitSize + 7) / 8
	x := padToSize(pub.X.Bytes(), fieldSize)
	y := padToSize(pub.Y.Bytes(), fieldSize)

	jsonStr := fmt.Sprintf(`{"crv":"%s","kty":"EC","x":"%s","y":"%s"}`,
		crv,
		base64.RawURLEncoding.EncodeToString(x),
		base64.RawURLEncoding.EncodeToString(y),
	)
	return []byte(jsonStr)
}

// --- utility ---

func binaryBigEndian(b []byte, v uint32) {
	b[0] = byte(v >> 24)
	b[1] = byte(v >> 16)
	b[2] = byte(v >> 8)
	b[3] = byte(v)
}

func bytesTrimLeadingZeros(b []byte) []byte {
	for len(b) > 0 && b[0] == 0 {
		b = b[1:]
	}
	if len(b) == 0 {
		return []byte{0}
	}
	return b
}

func padToSize(b []byte, size int) []byte {
	if len(b) >= size {
		return b
	}
	result := make([]byte, size)
	copy(result[size-len(b):], b)
	return result
}

// Ensure we always have a non-zero random reader available for any future use.
var _ = rand.Reader
