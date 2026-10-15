@echo off

for %%i in (
custtab_694_5250636_sb2_174
custtab_695_5250636_sb2_474
custtab_17_3776644_208
custtab_700_5250636_sb2_426
custtab_128_5250636_sb1_825
custtab_167_2772245_469
custtab_741_5250636_sb2_783
) do (
    suitecloud object:import --type ALL --destinationfolder "/Objects" --scriptid %%i
)