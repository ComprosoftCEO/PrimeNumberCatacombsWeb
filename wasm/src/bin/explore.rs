use std::collections::{HashSet, VecDeque};
use std::iter::{once, FromIterator};

use num::BigUint;
use prime_number_catacombs::CatacombNumber;
use structopt::StructOpt;

/// Recursively explore the catacombs using a breadth-first search
#[derive(StructOpt)]
struct Opt {
  /// Starting number
  #[structopt(short, long, default_value = "2")]
  start: BigUint,

  /// Numeric base (2 to 255)
  #[structopt(short, long, default_value = "2")]
  base: u8,

  /// Hamming distance for search (1..)
  #[structopt(short, long, default_value = "1")]
  hamming_distance: usize,

  /// Maximum number of search iterations
  #[structopt(short, long, default_value = "1000")]
  iterations: u64,
}

pub fn main() {
  let opt: Opt = Opt::from_args();

  println!("Start: {} (Level 0)", opt.start);

  let mut iteration = 1;
  let mut visited = HashSet::new();
  let mut queue = VecDeque::from_iter(once((opt.start, 1usize)));

  'exit: loop {
    let entry = queue.pop_back();
    if entry.is_none() {
      println!("No more numbers!");
      break 'exit;
    }

    let (current_number, indentation) = entry.unwrap();
    for number in CatacombNumber::compute_catacombs(&current_number, opt.base, opt.hamming_distance)
      .into_iter()
      .filter(CatacombNumber::is_prime)
      .map(CatacombNumber::into_value)
    {
      if iteration > opt.iterations {
        break 'exit;
      }

      if visited.contains(&number) {
        continue;
      }

      println!("{}: {} (Level {})", iteration, number, indentation);

      queue.push_front((number.clone(), indentation + 1));
      visited.insert(number);
      iteration += 1;
    }
  }
}
