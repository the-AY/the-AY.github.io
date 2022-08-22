Infosys pseudocode

1) what will be the output of the following program when val=4

Set
Integer i=3
Set Integer a=0
Set 
Integer b=1
if(val==1)
then do display a
end-if 
if(val>=2)
then do display a,b
end-if
while(i=<val)
c=a+b 
display c a-b b-c  i++
end while 

1) 112
2) 0112
3) 01
4) 011
--------------------------------------------------------------------

2) what will happen following program is executed
Set Integer Emp_no=101
Set Integer salary =0
do salary salary+100
display salary
while(Emp_no=0) end do-while

1) Code will produce an error.
2) Code is executed successfully and value of salary is displayed infinite number of times.
3) Code is executed successfully and nothing is displayed.
4) Code is executed successfully and value of salary displayed once.

--------------------------------------------------------------------

3) what will happen following pseudocode ?
Set 
Integer x=2
Set
Integer y=0
Set
Integer Z=0
while(i<5)
x=x*x+x y++ z=x+y
display z i=5
end-while

1) 4
2) 7
3) 9
4) 25

--------------------------------------------------------------------

4) How may=ny iterations will the following code make to find key with value 5?
Set
Integer array[5.7,15,21,38]
Integer middle Set Integer low = 0
Set Integer high = 4
while(low < high)
middle = low + (high-low)/2
if (array(middle) equals key)
do display middle
else if(array[middle] < key) low = middle +1
else high middle-1
end-while

1) 0
2) 1
3) 2
4) 3
--------------------------------------------------------------------
5)
what will happen when the following code is executed?
Set Integer a=2
Set Integer b=3
while(0) a=a*b
display a 
end-while

1) 2 will be displayed
2) infite loop 
3) 6 will be displayed
4) Nothing will be displayed
--------------------------------------------------------------------
6) 
How will the output array be after following operations?
Set Integer array= (1.3.5.7.8)
Set Integer item = 10
Sel Integer k=3
Set Integer n = 5
Sel Integer j=n 
Set Integer n=n+1
while(j>=k)
array[j+1] = array[i]
end-while
array[k] = item

1) (1,3,5,7,6)
2) (1,3,7,8)
3) (1,3,5)
4) (1,3,5,10,7,8)
--------------------------------------------------------------------
7)
what will be the output of the following program?
Set
float n 3.0
switch(m)
case 1: display "Pseudocode"
break
case 2: display "Test"
break
case 3. display "Competition"
break
end-switch

1) Error
2) Test
3) Competition
4) Pseudocode Test

--------------------------------------------------------------------
8)

what will happen when stack=[3,4,7] and stack size is 5
Set Integer data=10
if
stack is full return null
endif
top =top + 1 stack[top] =data

1) 7 will be overwritten by 10
2) 10 will be overwritten after 7
3) 4 will be overwritten by 10
4) 10 will not be appended to stack

--------------------------------------------------------------------
9)
what will be the output ?
when
MAXSIZE=4 and stack=[5,12,20,33]?
if top equal to MAXSIZE display TRUE
else
display FALSE
endif

1) TRUE
2) FALSE
3) nothing will be displayed
4) Garbage value

--------------------------------------------------------------------
10)
What will the output? when pos=2?
Set Integer array=[3,6,8,5,0]
for c=pos-1 to 4
step 1
do array[c]=array[c+1]

1) [3,6,8,5]
2) [6,8,5,0]
3) [3,6,5,0]
4) [3,8,5,0]