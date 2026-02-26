# Test
This folder contains all scripts and data used to evaluate application performance and reliability in particular scenarios.
All the test were made by using the html page called `postest.html`, using custom scripts and snippets to store times and evaluate performace.

## Detect Markers
Tests the marker detection performance
 - `detectMakers.ipynb`

## POSIT Errors
Evaluate and analyze the POSIT alghoritm errors.
- `poserror.ipynb`

## Rendering Efficiency
Evaluating render times with an increasing amount of robot at the same time
 - `rendertest.ipynb`
 - `perfTest.json`

## Communication times
To analyze communication times the measured time correspond to the time used to execute all the operations when a message is received.
Python scripts were created to send mqtt messages to `robot-emulation`.

- `move.py`
- `moveAll.py`
- `stopAll.py`
