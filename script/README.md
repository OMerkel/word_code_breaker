# Scripts

## Quickstart

de_txt_to_5_letters.py :

- script takes an argument named input_file
- it reads the input_file line by line
- in each line it removes special characters not being alphabetical or German Umlauts or spaces
- then it splits the line at spaces into an array
- then filter the array so that the remaining words have length of exactly 5 characters
- append all words to that array from file de_5_letters.txt if exists
- the resulting word entries in the array shall be unique and lower case
- the array of words shall be sorted alphabetically in ascending order inside the array
- result is written into file de_5_letters.txt (each word line by line)
- finally print the amount of words

Usage: de_txt_to_5_letters.py input_file

The result is written to de_5_letters.txt

en_txt_to_5_letters.py:

- script takes an argument named input_file
- it reads the input_file line by line
- in each line it removes special characters not being alphabetical or spaces
- then it splits the line at spaces into an array
- then filter the array so that the remaining words have length of exactly 5 characters
- append all words to that array from file en_5_letters.txt if exists
- the resulting word entries in the array shall be unique and lower case
- the array of words shall be sorted alphabetically in ascending order inside the array
- result is written into file en_5_letters.txt (each word line by line)
- finally print the amount of words

Usage: en_txt_to_5_letters.py input_file

The result is written to en_5_letters.txt
