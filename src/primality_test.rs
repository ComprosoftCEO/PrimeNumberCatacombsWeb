use lazy_static::lazy_static;
use num::bigint::{BigUint, RandBigInt};
use num::iter::{range, range_inclusive};
use num::{One, Zero};

lazy_static! {
  static ref ZERO: BigUint = BigUint::zero();
  static ref ONE: BigUint = BigUint::one();
  static ref TWO: BigUint = BigUint::from(2u32);
  static ref THREE: BigUint = BigUint::from(3u32);
  static ref FIVE: BigUint = BigUint::from(5u32);
  static ref SIX: BigUint = BigUint::from(6u32);
  static ref PRIME_THRESHOLD: BigUint = BigUint::from(1_000_000u64);
}

const NUM_TRIALS: usize = 128;

/// Determine if a given input is prime
pub fn is_prime(input: &BigUint) -> bool {
  if input < &*PRIME_THRESHOLD {
    naive_prime_test(input)
  } else {
    miller_rabin_is_prime(input, NUM_TRIALS)
  }
}

/// Naive prime number test that uses the 6x-1 optimization.
/// This test should work better for smaller numbers
fn naive_prime_test(n: &BigUint) -> bool {
  if n <= &*THREE {
    return n > &*ONE;
  }

  if ((n % &*TWO) == *ZERO) || ((n % &*THREE) == *ZERO) {
    return false;
  }

  let mut i = FIVE.clone();
  while &(&i * &i) <= n {
    if ((n % &i) == *ZERO) || (n % (&i + &*TWO) == *ZERO) {
      return false;
    }
    i += &*SIX;
  }

  true
}

/// Use the Miller-Rabin primality test to see if a number is prime
/// This test works better for larger numbers
fn miller_rabin_is_prime(n: &BigUint, trials: usize) -> bool {
  let mut rng = rand::thread_rng();

  // Common small primes
  if (n == &*TWO) || (n == &*THREE) {
    return true;
  }

  // Quick test for even numbers
  if (n <= &*ONE) || ((n % &*TWO) == *ZERO) {
    return false;
  }

  let (k, m) = find_k_and_m(n);

  'nextTrial: for _ in range(BigUint::zero(), BigUint::from(trials)) {
    let a = rng.gen_biguint_range(&*TWO, n);
    let mut b = a.modpow(&m, &n);
    if b == *ONE {
      continue 'nextTrial; /* x may be prime */
    }

    for _ in range_inclusive(BigUint::zero(), &k - &*ONE) {
      if b == (n - &*ONE) {
        continue 'nextTrial; /* x may be prime */
      }
      b = b.modpow(&*TWO, n);
    }

    return false; /* x is composite */
  }

  true
}

/// Find k and m where (n - 1) = 2^k * m
fn find_k_and_m(n: &BigUint) -> (BigUint, BigUint) {
  let mut k = BigUint::zero();
  let mut m = n - &*ONE;
  while (&m & &*ONE) == *ZERO {
    k = k + &*ONE;
    m = m / &*TWO;
  }

  (k, m)
}

/// Unit testing
#[cfg(test)]
mod test {
  #[allow(unused_imports)]
  use super::*;

  #[test]
  fn test_identifies_valid_small_primes() {
    let primes: Vec<u32> = vec![2, 3, 29, 739, 6011, 23357, 356591, 864419, 1298371];

    for prime in primes {
      assert_eq!(is_prime(&BigUint::from(prime)), true);
    }
  }

  #[test]
  fn test_identifies_valid_large_primes() {
    let primes = vec![
      BigUint::parse_bytes(b"14023952574152327483", 10).unwrap(),
      BigUint::parse_bytes(b"12760621611945695291", 10).unwrap(),
      BigUint::parse_bytes(b"15209844024681909301", 10).unwrap(),
      BigUint::parse_bytes(b"10783965725805802043", 10).unwrap(),
    ];

    for prime in primes {
      assert_eq!(is_prime(&prime), true);
    }
  }

  #[test]
  fn test_identifies_invalid_small_primes() {
    let primes: Vec<u32> = vec![4, 6, 15, 741, 6015, 23358, 35659, 864405, 1298377];

    for prime in primes {
      assert_eq!(is_prime(&BigUint::from(prime)), false, "Is Not Prime: {}", prime);
    }
  }

  #[test]
  fn test_identifies_invalid_large_primes() {
    let nonprimes = vec![
      BigUint::parse_bytes(b"14023952574152327473", 10).unwrap(),
      BigUint::parse_bytes(b"12760621611945595291", 10).unwrap(),
      BigUint::parse_bytes(b"15209744024681909301", 10).unwrap(),
      BigUint::parse_bytes(b"10883965725805802043", 10).unwrap(),
    ];

    for nonprime in nonprimes {
      assert_eq!(is_prime(&nonprime), false);
    }
  }
}
