# Psychometric function simulation

This simulates a Yes/No experiment with a simple two-parameter signal detection theory based psychometric function

p(r = 1) = Phi(c + s/sigma)

in which Phi is the CDF of the normal distribution, c is the criterion, sigma is standard deviation of the noise distribution and s is the signal level.

You can choose from three stimulus selection schemes:
1) Uniform random distribution
2) Place stimuli at posterior mean (of the sigma parameter)
3) Minimize posterior entropy

## How to run

Create a server that points to the directory. If you have python installed, at least on Linux you can do that easily by opening the directory in your terminal and typing

```
python3 -m http.server 8000
```
Then use your brower and open localhost:8000
