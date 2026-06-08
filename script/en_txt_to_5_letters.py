#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""Convert a text file to a unique, sorted list of 5-letter words.
Concentrating on English words only.

Usage: en_txt_to_5_letters.py input_file
The result is written to en_5_letters.txt.
"""

import argparse
import re
from pathlib import Path


OUTPUT_FILE = Path('en_5_letters.txt')
ALLOWED_CHARS_PATTERN = re.compile(r'[^A-Za-z ]+')
VALID_WORD_PATTERN = re.compile(r'^[A-Za-z]{5}$')


def main():
    """Main function to convert a text file to a list of 5-letter words."""
    parser = argparse.ArgumentParser(
        description="Convert a text file to a unique, "
        "sorted list of 5-letter English words.",
        epilog='Example: en_txt_to_5_letters.py input.txt'
    )
    parser.add_argument(
        'input_file',
        help='Input text file to process (UTF-8 encoded)'
    )
    args = parser.parse_args()

    words = []
    with open(args.input_file, 'r', encoding='utf-8') as infile:
        for line in infile:
            cleaned_line = ALLOWED_CHARS_PATTERN.sub('', line)
            parts = cleaned_line.split()
            five_letter_parts = [word.lower() for word in parts
                                 if len(word) == 5]
            words.extend(five_letter_parts)

    if OUTPUT_FILE.exists():
        with OUTPUT_FILE.open('r', encoding='utf-8') as existing_file:
            for line in existing_file:
                word = line.strip().lower()
                if VALID_WORD_PATTERN.fullmatch(word):
                    words.append(word)

    unique_sorted_words = sorted(set(words))

    with OUTPUT_FILE.open('w', encoding='utf-8') as outfile:
        for word in unique_sorted_words:
            outfile.write(word + '\n')

    print(len(unique_sorted_words))


if __name__ == '__main__':
    main()
